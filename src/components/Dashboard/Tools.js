"use client";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCardIcon, DocumentTextIcon, CurrencyDollarIcon, ArrowUpTrayIcon, XMarkIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';

const AITools = () => {
    const [selectedTool, setSelectedTool] = useState(null);
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [userCredits, setUserCredits] = useState(100);
    const [chatMessages, setChatMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const chatEndRef = useRef(null);

    const tools = [
        { 
            id: 'cnic', 
            name: 'CNIC Extraction', 
            credits: 5, 
            icon: DocumentTextIcon,
            description: 'Extract information from CNIC documents',
            requirements: 'Clear image of CNIC (front side)'
        },
        { 
            id: 'emirates', 
            name: 'Emirates ID Processing', 
            credits: 8, 
            icon: CreditCardIcon,
            description: 'Process and extract data from Emirates ID cards',
            requirements: 'High-resolution scan of Emirates ID (both sides)'
        },
        {
            id: 'rag',
            name: 'RAG Chat',
            credits: 10,
            icon: ChatBubbleLeftEllipsisIcon,
            description: 'Chat with AI using your own knowledge base',
            requirements: 'PDF or TXT document as knowledge base'
        }
    ];

    const onDrop = useCallback((acceptedFiles) => {
        setFile(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleToolSelect = (tool) => {
        setSelectedTool(tool);
        if (selectedTool && selectedTool.id !== tool.id) {
            setFile(null);
            setChatMessages([]);
        }
        setResult(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !selectedTool) return;

        if (userCredits < selectedTool.credits) {
            alert("Insufficient credits to use this tool.");
            return;
        }

        setProcessing(true);
        // Simulating API call
        setTimeout(() => {
            if (selectedTool.id === 'rag') {
                setChatMessages([
                    { role: 'system', content: 'Knowledge base uploaded. You can now start chatting!' }
                ]);
            } else {
                setResult({
                    success: true,
                    data: {
                        name: "John Doe",
                        id: "1234-5678-9012-3456",
                        dob: "1990-01-01"
                    }
                });
            }
            setUserCredits(prevCredits => prevCredits - selectedTool.credits);
            setProcessing(false);
        }, 2000);
    };

    const handleChatSubmit = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const newMessage = { role: 'user', content: inputMessage };
        setChatMessages(prevMessages => [...prevMessages, newMessage]);
        setInputMessage('');

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = { role: 'assistant', content: 'This is a simulated response based on the uploaded knowledge base.' };
            setChatMessages(prevMessages => [...prevMessages, aiResponse]);
        }, 1000);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">AI Tools Integration</h1>
                
                <div className="mb-8 text-center">
                    <p className="text-xl">Your Credits: <span className="font-bold text-green-400">{userCredits}</span></p>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Available Tools</h2>
                        <div className="grid gap-4">
                            {tools.map((tool) => (
                                <motion.div
                                    key={tool.id}
                                    className={`bg-gray-800 p-6 rounded-lg cursor-pointer transition-all hover:shadow-lg ${selectedTool?.id === tool.id ? 'ring-2 ring-blue-500' : ''}`}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => handleToolSelect(tool)}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <tool.icon className="h-8 w-8 mr-4 text-blue-500" />
                                            <div>
                                                <h3 className="text-xl font-semibold">{tool.name}</h3>
                                                <p className="text-sm text-gray-400">{tool.description}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-green-400 font-semibold">{tool.credits} credits</p>
                                            <p className="text-xs text-gray-400">per use</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        <p><span className="font-semibold">Requirements:</span> {tool.requirements}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Tool Interface</h2>
                        <AnimatePresence mode="wait">
                            {selectedTool ? (
                                <motion.div
                                    key={selectedTool.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-gray-800 p-6 rounded-lg shadow-xl"
                                >
                                    <h3 className="text-xl font-semibold mb-2">{selectedTool.name}</h3>
                                    <p className="text-sm text-gray-400 mb-4">Cost: {selectedTool.credits} credits</p>
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-2">Upload Document</label>
                                            {file ? (
                                                <div className="flex items-center justify-between bg-gray-700 p-2 rounded-lg">
                                                    <p className="text-sm text-gray-300 truncate">{file.name}</p>
                                                    <div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFile(null)}
                                                            className="text-red-500 hover:text-red-700 mr-2"
                                                        >
                                                            <XMarkIcon className="h-5 w-5" />
                                                        </button>
                                                        <label className="cursor-pointer text-blue-500 hover:text-blue-700">
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                onChange={(e) => setFile(e.target.files[0])}
                                                            />
                                                            Change
                                                        </label>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div {...getRootProps()} className="flex items-center justify-center w-full">
                                                    <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-all ${isDragActive ? 'border-blue-500' : ''}`}>
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <ArrowUpTrayIcon className="w-8 h-8 mb-4 text-gray-400" />
                                                            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                            <p className="text-xs text-gray-400">SVG, PNG, JPG, GIF, PDF or TXT</p>
                                                        </div>
                                                        <input {...getInputProps()} />
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!file || processing || userCredits < selectedTool.credits}
                                        >
                                            {processing ? 'Processing...' : `Process Document (${selectedTool.credits} credits)`}
                                        </button>
                                    </form>
                                    <AnimatePresence>
                                        {result && selectedTool.id !== 'rag' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="mt-6 bg-gray-700 p-4 rounded-lg"
                                            >
                                                <h4 className="text-lg font-semibold mb-2">Result:</h4>
                                                <pre className="text-sm overflow-x-auto">
                                                    {JSON.stringify(result, null, 2)}
                                                </pre>
                                            </motion.div>
                                        )}
                                        {selectedTool.id === 'rag' && chatMessages.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="mt-6 bg-gray-700 p-4 rounded-lg"
                                            >
                                                <h4 className="text-lg font-semibold mb-2">Chat:</h4>
                                                <div className="h-64 overflow-y-auto mb-4">
                                                    {chatMessages.map((msg, index) => (
                                                        <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                            <span className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                                                {msg.content}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <div ref={chatEndRef} />
                                                </div>
                                                <form onSubmit={handleChatSubmit} className="flex">
                                                    <input
                                                        type="text"
                                                        value={inputMessage}
                                                        onChange={(e) => setInputMessage(e.target.value)}
                                                        className="flex-grow bg-gray-600 text-white rounded-l-lg px-4 py-2 focus:outline-none"
                                                        placeholder="Type your message..."
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition duration-300"
                                                    >
                                                        Send
                                                    </button>
                                                </form>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-gray-800 p-6 rounded-lg text-center"
                                >
                                    <p className="text-gray-400">Select a tool to get started</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AITools;