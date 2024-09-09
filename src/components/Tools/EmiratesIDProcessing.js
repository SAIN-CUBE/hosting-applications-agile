import { useState, useCallback, useRef } from 'react'
import { CreditCardIcon, ArrowUpTrayIcon, XMarkIcon, PlayIcon , ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

export default function EmiratesIDProcessing() {
  const [files, setFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('tool')
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const abortControllerRef = useRef(null)

  const onDrop = useCallback((acceptedFiles) => {
    if (processing) {
      // Cancel ongoing processing
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      setProcessing(false)
    }
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles])
    setResults([])
    setError(null)
  }, [processing])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    noClick: true,
    noKeyboard: true,
  })

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;
  
    setProcessing(true);
    setError(null);
    setResults([]);
    
    const cancelTokenSource = axios.CancelToken.source();
  
    try {
      const newResults = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
  
        let retries = 0;
        while (retries < MAX_RETRIES) {
          try {
            const response = await axios.post('/api/tools/use/emirates-id-processing/', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              cancelToken: cancelTokenSource.token,
              timeout: 30000,  // 30 seconds timeout
            });
            newResults.push({ fileName: file.name, data: response.data });
            break; // Successful, exit retry loop
          } catch (error) {
            if (axios.isCancel(error) || error.code === 'ECONNABORTED' || retries === MAX_RETRIES - 1) {
              throw error; // Rethrow if canceled, timed out, or max retries reached
            }
            retries++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
      setResults(newResults);
    } catch (error) {
      setError(error.response?.data?.detail || 'An error occurred while processing the files.');
    } finally {
      setProcessing(false);
    }
  };


  const DataCard = ({ title, data }) => (
    <div className="bg-gray-700 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {Object.entries(data).map(([key, value]) => (
        <p key={key} className="text-gray-300">
          <span className="font-medium">{key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {value || 'N/A'}
        </p>
      ))}
    </div>
  );
  
  const ResultCard = ({ data, fileName }) => {
    const [copied, setCopied] = useState(false);
  
    const formatData = (obj) => {
      let result = '';
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          result += `${key}:\n${formatData(value)}`;
        } else {
          result += `${key}: ${value}\n`;
        }
      }
      return result;
    };
  
    const formattedData = formatData(data);
  
    const copyToClipboard = () => {
      navigator.clipboard.writeText(formattedData).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };
  
    const trimFileName = (name) => {
      if (name.length > 20) {
        return name.substring(0, 17) + '...';
      }
      return name;
    };

    // Function to remove duplicate image results
    const uniqueImageResults = data.images_results ? 
      data.images_results.filter((v, i, a) => 
        a.findIndex(t => JSON.stringify(t.detected_data) === JSON.stringify(v.detected_data)) === i
      ) : [];
  
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{trimFileName(fileName)} Results</h2>
          <button
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            {copied ? <CheckIcon className="h-6 w-6" /> : <ClipboardIcon className="h-6 w-6" />}
          </button>
        </div>
        <div className="space-y-6">
          {uniqueImageResults.length > 0 ? (
            uniqueImageResults.map((imageResult, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Image {index + 1}</h3>
                <DataCard title="Detected Data" data={imageResult.detected_data} />
              </div>
            ))
          ) : (
            <p className="text-gray-300">No unique image results available.</p>
          )}
        </div>
      </div>
    );
  };

  
  const handleFileSelection = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 0) {
      if (processing) {
        // Cancel ongoing processing
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        setProcessing(false)
      }
      setFiles(prevFiles => [...prevFiles, ...selectedFiles])
      setResults([])
    }
  }

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
    setResults(prevResults => prevResults.filter((_, i) => i !== index))
  }

  const totalCredits = files.length * 8

  const TabContent = () => {
    if (activeTab === 'tool') {
      return (
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">Upload Emirates IDs</label>
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${isDragActive ? 'border-green-400 bg-green-400/10' : 'border-gray-600 hover:border-gray-500'}`}>
                  <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-300">Drag & drop Emirates ID images here</p>
                  <button
                    type="button"
                    onClick={handleFileSelection}
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Select Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    multiple
                  />
                </div>
              </div>
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-300 truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:from-green-600 hover:to-teal-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-102 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={files.length === 0 || processing}
            >
              {processing ? 'Processing...' : `Extract Emirates ID Data (${totalCredits} credits)`}
            </button>
          </form>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 bg-red-800/50 p-6 rounded-lg backdrop-blur-sm"
            >
              <h4 className="text-lg font-semibold mb-4 text-red-200">Error:</h4>
              <p className="text-red-100">{error}</p>
            </motion.div>
          )}

{results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-12"
            >
              <div className="space-y-6">
                {results.map((result, index) => (
                  <ResultCard key={index} fileName={result.fileName} data={result.data} index={index} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )
    } else {
      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">About This Tool</h2>
            <p className="text-gray-300 mb-4">
              Our Emirates ID Processing tool uses advanced AI to extract and verify data from multiple Emirates ID cards quickly and accurately. Perfect for businesses needing to validate customer information or for individuals wanting to digitize their ID details.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Fast and accurate data extraction for multiple Emirates IDs</li>
              <li>Supports all Emirates ID formats</li>
              <li>Secure and private processing</li>
              <li>Results in seconds</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Demo Video</h2>
            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster="/path-to-video-thumbnail.jpg"
              >
                <source src="/path-to-demo-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <button
                onClick={() => videoRef.current.play()}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 hover:bg-opacity-40 transition-opacity group"
              >
                <PlayIcon className="h-16 w-16 text-white opacity-75 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-8 shadow-2xl max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 space-y-4 md:space-y-0">
        <div className="flex items-center">
          <CreditCardIcon className="h-12 w-12 mr-4 text-green-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-400">Emirates ID Processing</h1>
        </div>
        <p className="text-green-400 font-semibold bg-green-400/10 px-4 py-2 rounded-full">8 credits per Emirates ID</p>
      </div>

      <div className="mb-8">
        <div className="flex space-x-1 rounded-xl bg-gray-700/50 p-1">
          <button
            onClick={() => setActiveTab('tool')}
            className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-white transition-all ${
              activeTab === 'tool'
                ? 'bg-gray-900 shadow'
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            Tool
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-white transition-all ${
              activeTab === 'about'
                ? 'bg-gray-900 shadow'
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            About
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <TabContent />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
