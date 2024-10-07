"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, ArrowUpTrayIcon, XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { formatDistanceToNow } from 'date-fns';

const RAGChat = () => {
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);

  // Create axios instance with interceptor
  const axiosInstance = axios.create({
    headers: {
      'AuthSID': `SID ${localStorage.getItem('sid')}`,
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Call-Source': 'app'
    }
  });

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

  // Effect for handling copy button timeout
  useEffect(() => {
    if (copiedIndex !== null) {
      const timer = setTimeout(() => setCopiedIndex(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedIndex]);

  // Effect for scrolling to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const renderMessage = (message, index) => {
    const isAI = message.type === 'ai';
    
    // Function to process text and combine numbered points with their content
    const processText = (text) => {
      return text.replace(/^(\d+\.)\s*(.*?)$/gm, (match, number, content) => {
        return `${number} ${content}`;
      });
    };
  
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}
      >
        <div className={`max-w-3/4 p-4 rounded-lg ${
          isAI ? 'bg-gray-700' : 'bg-purple-600'
        }`}>
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-medium mb-2" {...props} />,
              p: ({ node, children, ...props }) => {
                const processedChildren = React.Children.map(children, child => {
                  if (typeof child === 'string') {
                    return processText(child);
                  }
                  return child;
                });
                return <p className="mb-4 leading-relaxed" {...props}>{processedChildren}</p>;
              },
              ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
              li: ({ node, children, ...props }) => {
                const processedChildren = React.Children.map(children, child => {
                  if (typeof child === 'string') {
                    return processText(child);
                  }
                  return child;
                });
                return <li className="mb-1" {...props}>{processedChildren}</li>;
              },
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-gray-400 pl-4 italic my-4" {...props} />
              ),
              hr: () => <hr className="my-4 border-gray-500" />,
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border-collapse" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => <thead className="bg-gray-800" {...props} />,
              th: ({ node, ...props }) => (
                <th className="border border-gray-600 px-4 py-2 text-left font-semibold" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="border border-gray-600 px-4 py-2" {...props} />
              ),
              tr: ({ node, isHeader, ...props }) => (
                <tr className={`${isHeader ? 'bg-gray-800' : 'even:bg-gray-750'}`} {...props} />
              ),
              img: ({ node, ...props }) => (
                <img className="max-w-full h-auto rounded-lg my-4" {...props} alt={props.alt || ''} />
              ),
              a: ({ node, ...props }) => (
                <a className="text-blue-400 hover:text-blue-300 underline" {...props} />
              ),
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="relative my-4">
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gray-800 rounded-t flex items-center px-4">
                      <span className="text-sm text-gray-400">{match[1]}</span>
                    </div>
                    <SyntaxHighlighter
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      className="pt-8 !mt-0 !mb-0"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                    <CopyToClipboard text={String(children)} onCopy={() => setCopiedIndex(index)}>
                      <button className="absolute top-1 right-2 bg-gray-700 text-white px-2 py-1 rounded text-sm hover:bg-gray-600 transition-colors">
                        {copiedIndex === index ? 'Copied!' : 'Copy'}
                      </button>
                    </CopyToClipboard>
                  </div>
                ) : (
                  <code className={`${className} bg-gray-800 rounded px-1 py-0.5`} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </motion.div>
    );
  };

  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
    setChatReady(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': [] },
    noClick: true,
    noKeyboard: true,
  });

  const handleSend = async (e) => {
    e.preventDefault();
    const input = inputRef.current.value.trim();
    if (input === '' || !file) return;
  
    const newMessage = { type: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    inputRef.current.value = '';
  
    setProcessing(true);
    try {
      const response = await axiosInstance.post('/api/tools/use/chat-with-pdf/chat/', {
        question: input
      });
  
      if (response.data && response.data.answer) {
        const aiMessage = { type: 'ai', content: response.data.answer, timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.status !== 401) {
        const errorMessage = error.response?.data?.error || 'An error occurred while processing your request.';
        setMessages(prev => [...prev, { type: 'system', content: errorMessage, timestamp: new Date() }]);
      }
    } finally {
      setProcessing(false);
    }
  };
  
  const handleFileUpload = async () => {
    if (!file) return;
    setProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await axiosInstance.post('/api/tools/use/chat-with-pdf/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      setChatReady(true);
      setMessages([{ type: 'system', content: `File "${file.name}" is ready. You can now start chatting!`, timestamp: new Date() }]);
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response?.status !== 401) {
        setMessages([{ type: 'system', content: 'Error uploading file. Please try again.', timestamp: new Date() }]);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleChangePDF = async () => {
    if (!file) return;
    setProcessing(true);
    
    try {
      await axiosInstance.delete('/api/tools/use/chat-with-pdf/delete/', {
        data: { document_names: [file.name] }
      });
      
      setFile(null);
      setChatReady(false);
      setMessages([{ type: 'system', content: 'Previous PDF deleted. You can now upload a new one.', timestamp: new Date() }]);
    } catch (error) {
      console.error('Error deleting file:', error);
      if (error.response?.status !== 401) {
        setMessages(prev => [...prev, { type: 'system', content: 'Error deleting file. Please try again.', timestamp: new Date() }]);
      }
    } finally {
      setProcessing(false);
    }
  };

  const TabContent = () => {
    if (activeTab === 'chat') {
      return (
        <>
          {chatReady && (
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-300">Current file: {file.name}</p>
              <button
                onClick={handleChangePDF}
                className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Change PDF'}
              </button>
            </div>
          )}
          <div 
            ref={chatContainerRef}
            className="flex-1 mb-4 space-y-4 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
          >
            <AnimatePresence>
              {messages.map((message, index) => renderMessage(message, index))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
          {chatReady && (
            <form onSubmit={handleSend} className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg px-4 py-2 transition duration-300 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                disabled={processing || !chatReady}
              >
                {processing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
              </button>
            </form>
          )}
        </>
      );
    } else {
      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">About RAG Chat</h2>
            <p className="text-gray-300 mb-4">
              RAG Chat is an advanced AI-powered tool that allows you to chat with your own knowledge base. Upload your documents and start asking questions to get instant, relevant answers.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Supports PDF and TXT files</li>
              <li>AI-powered document understanding</li>
              <li>Real-time question answering</li>
              <li>Secure and private processing</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">How to Use</h2>
            <ol className="list-decimal list-inside text-gray-300 space-y-2">
              <li>Upload your knowledge base (PDF or TXT file)</li>
              <li>Wait for the AI to process your document</li>
              <li>Start asking questions in the chat interface</li>
              <li>Receive instant, context-aware answers</li>
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Demo Video</h2>
            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster="/api/placeholder/640/360"
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
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-8 shadow-2xl max-w-4xl mx-auto flex flex-col overflow-hidden">      
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 space-y-4 md:space-y-0">
        <div className="flex items-center">
          <ChatBubbleLeftEllipsisIcon className="h-12 w-12 mr-4 text-purple-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">RAG Chat</h1>
        </div>
        <p className="text-purple-400 font-semibold bg-purple-400/10 px-4 py-2 rounded-full">AI-Powered Knowledge Base Chat</p>
      </div>

      <div className="mb-8">
        <div className="flex space-x-1 rounded-xl bg-gray-700/50 p-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-white transition-all ${
              activeTab === 'chat'
                ? 'bg-gray-900 shadow'
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            Chat
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
          className="flex-1 flex flex-col"
        >
          {!chatReady && activeTab === 'chat' ? (
            <div className="flex-1 flex items-center justify-center">
              {file ? (
                <div className="text-center">
                  <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-300 truncate">{file.name}</p>
                    <button
                      onClick={() => setFile(null)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleFileUpload}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 hover:from-purple-600 hover:to-indigo-600"
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Process Knowledge Base'}
                  </button>
                </div>
              ) : (
                <div {...getRootProps()} className="cursor-pointer w-full max-w-md">
                  <input {...getInputProps()} />
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${isDragActive ? 'border-purple-400 bg-purple-400/10' : 'border-gray-600 hover:border-gray-500'}`}>
                    <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-300">Drag & drop your knowledge base file here</p>
                    <button
                      type="button"
                      onClick={open}
                      className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                    >
                      Select File
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <TabContent />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RAGChat;