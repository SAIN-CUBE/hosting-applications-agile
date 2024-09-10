"use client"

import React, { useState, useCallback, useRef } from 'react'
import { DocumentTextIcon, ArrowUpTrayIcon, XMarkIcon, PlayIcon, ClipboardIcon, CheckIcon, CodeBracketIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

export default function MultiCNICExtraction() {
  const [files, setFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('tool')
  const [viewMode, setViewMode] = useState('text')
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

  const onDrop = useCallback((acceptedFiles) => {
    if (processing) {
      axios.CancelToken.source().cancel('Operation canceled by the user.')
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
        formData.append('cnic', file);

        const response = await axios.post('/api/tools/use/cnic-data-extraction/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          cancelToken: cancelTokenSource.token,
          timeout: 30000,
        });

        newResults.push({ fileName: file.name, data: response.data });
      }
      setResults(newResults);
      setFiles([]); // Clear files after processing
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else {
        setError(`Failed to extract CNIC data: ${error.message}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelection = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 0) {
      if (processing) {
        axios.CancelToken.source().cancel('Operation canceled by the user.')
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

  const totalCredits = files.length * 5

  const ResultCard = ({ fileName, data }) => {
    const [copied, setCopied] = useState(false);
  
    const formatKey = (key) => key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };
  
    const stringifyValue = (value) => {
      if (typeof value === 'object' && value !== null) {
        return Array.isArray(value)
          ? `[${value.map(stringifyValue).join(', ')}]`
          : `{${Object.entries(value).map(([k, v]) => `${formatKey(k)}: ${stringifyValue(v)}`).join(', ')}}`;
      }
      return String(value);
    };
  
    const dataToDisplay = data.data || {};
    const textData = Object.entries(dataToDisplay)
      .map(([key, value]) => `${formatKey(key)}: ${stringifyValue(value)}`)
      .join('\n');
    const jsonData = JSON.stringify(data, null, 2);
  
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">{fileName}</h3>
            <button
              onClick={() => copyToClipboard(viewMode === 'text' ? textData : jsonData)}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              {copied ? <CheckIcon className="h-6 w-6" /> : <ClipboardIcon className="h-6 w-6" />}
            </button>
          </div>
          <div className="bg-gray-700 p-5 rounded">
            <div className="text-base leading-relaxed text-gray-200 whitespace-pre-wrap break-words">
              {viewMode === 'text' ? textData : jsonData}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const ViewToggle = () => (
    <div className="flex justify-end mb-4">
      <div className="bg-gray-700 rounded-lg p-1 flex">
        <button
          onClick={() => setViewMode('text')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'text' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          <ListBulletIcon className="h-5 w-5 inline-block mr-1" />
          Text
        </button>
        <button
          onClick={() => setViewMode('json')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'json' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          <CodeBracketIcon className="h-5 w-5 inline-block mr-1" />
          JSON
        </button>
      </div>
    </div>
  );
  
  const TabContent = () => {
    if (activeTab === 'tool') {
      return (
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">Upload CNICs</label>
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${isDragActive ? 'border-blue-400 bg-blue-400/10' : 'border-gray-600 hover:border-gray-500'}`}>
                  <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-300">Drag & drop CNIC images here</p>
                  <button
                    type="button"
                    onClick={handleFileSelection}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-102 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={files.length === 0 || processing}
            >
              {processing ? 'Processing...' : `Extract CNIC Data (${totalCredits} credits)`}
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
              <ViewToggle />
              <div className="space-y-6">
                {results.map((result, index) => (
                  <ResultCard key={index} fileName={result.fileName} data={result.data} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )
    } else {
      // About tab content remains the same
      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">About This Tool</h2>
            <p className="text-gray-300 mb-4">
              Our Multi-CNIC Extraction tool uses advanced AI to extract and verify data from multiple Pakistani Computerized National Identity Cards quickly and accurately. Ideal for businesses needing to validate customer information or for individuals wanting to digitize their ID details.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Fast and accurate data extraction for multiple CNICs</li>
              <li>Supports all CNIC formats</li>
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
          <DocumentTextIcon className="h-12 w-12 mr-4 text-blue-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Multi-CNIC Extraction</h1>
        </div>
        <p className="text-blue-400 font-semibold bg-blue-400/10 px-4 py-2 rounded-full">5 credits per CNIC</p>
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