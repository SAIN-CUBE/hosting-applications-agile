"use client";
import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCardIcon, ArrowUpTrayIcon, XMarkIcon, PlayIcon, ClipboardIcon, CheckIcon, CodeBracketIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const EmiratesIDProcessing = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tool');
  const [viewMode, setViewMode] = useState('normal');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Create an axios instance with default headers for both SID and Access Token
  const axiosInstance = axios.create({
    headers: {
      'AuthSID': `SID ${localStorage.getItem('sid')}`,
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Call-Source': 'app'
    }
  });

  // Add an interceptor to handle token refresh silently
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          const response = await axios.post('/api/token/refresh/', {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          axiosInstance.defaults.headers['Authorization'] = `Bearer ${access}`;
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Silently handle auth failure
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('sid');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  const onDrop = useCallback((acceptedFiles) => {
    if (processing) {
      setProcessing(false);
    }
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    setResults([]);
    setError(null);
  }, [processing]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    noClick: true,
    noKeyboard: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;
  
    setProcessing(true);
    setError(null);
    setResults([]);
  
    try {
      const newResults = [];
      const batchSize = 5; // Upload 5 files at a time
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const uploadPromises = batch.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const response = await axiosInstance.post('/api/tools/use/emirates-id-processing/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 600000,
          });
          return { fileName: file.name, data: response.data };
        });
        const batchResults = await Promise.all(uploadPromises);
        newResults.push(...batchResults);
      }
      setResults(newResults);
      setFiles([]); // Clear files after successful processing
    } catch (error) {
      console.error('Error processing files:', error);
      if (error.response?.status !== 401) {
        setError(error.response?.data?.detail || 'An error occurred while processing the files.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const ResultCard = ({ data, fileName }) => {
    const [copied, setCopied] = useState(false);
  
    const formatData = (obj) => {
      if (viewMode === 'json') {
        return JSON.stringify(obj, null, 2);
      }
      
      let result = '';
      if (obj.files_results && obj.files_results.length > 0) {
        obj.files_results.forEach((file) => {
          result += `File: ${file.file_name}\n\n`;
          file.file_results.forEach((imageResult, index) => {
            result += `Image ${index + 1}\n`;
            result += `Document Type: ${imageResult.image_metadata.Document_Type}\n`;
            result += `Side: ${imageResult.image_metadata.side}\n`;
            for (const [key, value] of Object.entries(imageResult.detected_data)) {
              result += `${key}: ${value}\n`;
            }
            result += '\n';
          });
        });
      }
      return result.trim();
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
          {viewMode === 'json' ? (
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-300">
              {formattedData}
            </pre>
          ) : (
            data.files_results && data.files_results.length > 0 && (
              data.files_results.map((file, fileIndex) => (
                <div key={fileIndex} className="">
                  {file.file_results.map((imageResult, imageIndex) => (
                    <div key={imageIndex} className="bg-gray-700 rounded-lg p-4 mb-4">
                      <h4 className="text-md font-semibold text-white mb-2">Image {imageIndex + 1}</h4>
                      <p className="text-gray-300 mb-1">
                        <span className="font-medium">Document Type:</span> {imageResult.image_metadata.Document_Type}
                      </p>
                      <p className="text-gray-300 mb-1">
                        <span className="font-medium">Side:</span> {imageResult.image_metadata.side}
                      </p>
                      <div className="text-gray-300">
                        {Object.entries(imageResult.detected_data).map(([key, value]) => (
                          <p key={key} className="mb-1">
                            <span className="font-medium">{key}:</span> {value || 'N/A'}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )
          )}
        </div>
      </div>
    );
  };

  const handleFileSelection = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      if (processing) {
        setProcessing(false);
      }
      setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
      setResults([]);
    }
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setResults((prevResults) => prevResults.filter((_, i) => i !== index));
  };

  const totalCredits = files.length * 8;

  const ViewToggle = () => (
    <div className="flex justify-end mb-4">
      <div className="bg-gray-700 rounded-lg p-1 flex">
        <button
          onClick={() => setViewMode('normal')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'normal' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          <ListBulletIcon className="h-5 w-5 inline-block mr-1" />
          Normal
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
              <label className="block text-sm font-medium text-gray-200">Upload UAE Documents</label>
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${isDragActive ? 'border-green-400 bg-green-400/10' : 'border-gray-600 hover:border-gray-500'}`}>
                  <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-300">Drag & drop UAE Document images here</p>
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
                    accept="image/*,application/pdf"
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
              {processing ? 'Processing...' : `Extract UAE Document Data (${totalCredits} credits)`}
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
      );
    } else {
      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">About This Tool</h2>
            <p className="text-gray-300 mb-4">
              Our UAE Document Processing tool uses advanced AI to extract and verify data from multiple UAE documents quickly and accurately. Perfect for businesses needing to validate customer information or for individuals wanting to digitize their document details.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Fast and accurate data extraction for multiple UAE documents</li>
              <li>Supports all UAE document formats</li>
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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-400">UAE Document Processing</h1>
        </div>
        <p className="text-green-400 font-semibold bg-green-400/10 px-4 py-2 rounded-full">8 credits per UAE Document</p>
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

export default EmiratesIDProcessing;