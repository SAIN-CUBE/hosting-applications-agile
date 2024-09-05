"use client";
import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, BarElement } from 'chart.js';
import { DocumentTextIcon, IdentificationIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { motion } from "framer-motion";

// Register required components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, BarElement);

const lineData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Credit Usage',
      data: [30, 70, 45, 85, 55, 95],
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      tension: 0.4,
      fill: true,
    },
    {
      label: 'API Calls',
      data: [20, 40, 60, 80, 50, 70],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      tension: 0.4,
      fill: true,
    },
  ],
};

const barData = {
  labels: ['CNIC', 'Emirates ID', 'RAG Chat'],
  datasets: [{
    label: 'Consumption',
    data: [65, 59, 80, 81, 56],
    backgroundColor: [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
    ],
    borderColor: [
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
    ],
    borderWidth: 1,
  }],
};

const tools = [
  {
    id: 'cnic',
    name: 'CNIC Extraction',
    credits: 5,
    icon: DocumentTextIcon,
    description: 'Extract information from CNIC documents',
    requirements: 'Clear image of CNIC (front side)',
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'emirates',
    name: 'Emirates ID Processing',
    credits: 8,
    icon: IdentificationIcon,
    description: 'Process and extract data from Emirates ID cards',
    requirements: 'High-resolution scan of Emirates ID (both sides)',
    color: 'from-green-400 to-green-600'
  },
  {
    id: 'rag',
    name: 'RAG Chat',
    credits: 10,
    icon: ChatBubbleLeftEllipsisIcon,
    description: 'Chat with AI using your own knowledge base',
    requirements: 'PDF or TXT document as knowledge base',
    color: 'from-purple-400 to-purple-600'
  }
];

const Body = () => {
  return (
    <div className="bg-gray-900 text-white px-3 sm:px-5 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-6">
        {/* App Consumption Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg transform transition-transform duration-500 hover:shadow-xl">
          <h2 className="text-2xl font-semibold mb-4">App Consumption</h2>
          <div className="h-64">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                  legend: { display: false },
                  tooltip: { 
                    backgroundColor: '#1f2937',
                    mode: 'index',
                    intersect: false,
                  },
                },
                scales: {
                  x: { 
                    grid: { color: 'rgba(55, 65, 81, 0.3)' },
                    ticks: { color: '#e5e7eb' },
                  },
                  y: { 
                    grid: { display: false },
                    ticks: { color: '#e5e7eb' },
                  },
                },
              }}
            />
          </div>
        </div>
        
        {/* Usage Stats Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg transform transition-transform duration-500 hover:shadow-xl">
          <h2 className="text-2xl font-semibold mb-4">Usage Stats</h2>
          <div className="h-64">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, position: 'top' },
                  tooltip: { 
                    backgroundColor: '#1f2937',
                    mode: 'index',
                    intersect: false,
                  },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#e5e7eb' } },
                  y: { 
                    grid: { color: 'rgba(55, 65, 81, 0.3)' }, 
                    ticks: { color: '#e5e7eb' },
                    beginAtZero: true,
                  },
                },
                interaction: {
                  mode: 'nearest',
                  axis: 'x',
                  intersect: false
                },
              }}
            />
          </div>
        </div>
      </div>
      <h2 className="text-2xl font-semibold mb-6 pt-7 pl-2">Tool Box</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
};

function ToolCard({ tool }) {
  return (
    <Link href={`/dashboard/ai-tools/${tool.id}`} className="block">
      <motion.div
        className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out h-full"
        whileHover={{ y: -5 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={`h-2 bg-gradient-to-r ${tool.color}`} />
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-full bg-gradient-to-br ${tool.color}`}>
              <tool.icon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-semibold">{tool.name}</h3>
              <p className="text-sm text-gray-400">{tool.description}</p>
            </div>
          </div>
          <div className="mt-4 flex-grow">
            <p className="text-sm text-gray-400">
              <span className="font-semibold">Requirements:</span> {tool.requirements}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="bg-gray-700 px-3 py-1 rounded-full">
              <p className="text-green-400 font-semibold">{tool.credits} credits</p>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default Body;