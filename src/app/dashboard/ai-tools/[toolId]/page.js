// pages/dashboard/ai-tools/[toolId].js
"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/app/dashboard/ai-tools/layout'
import { ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import AppBar from '@/components/Dashboard/AppBar'
import CNICExtraction from '@/components/Tools/CNICExtraction'
import EmiratesIDProcessing from '@/components/Tools/EmiratesIDProcessing'
import RAGChat from '@/components/Tools/RAGChat'

const tools = {
  cnic: {
    name: 'CNIC Extraction',
    component: CNICExtraction,
    credits: 5,
  },
  emirates: {
    name: 'Emirates ID Processing',
    component: EmiratesIDProcessing,
    credits: 8,
  },
  rag: {
    name: 'RAG Chat',
    component: RAGChat,
    credits: 10,
  },
}

export default function ToolPage() {
  const params = useParams()
  const toolId = params.toolId
  const tool = tools[toolId]

  const [totalCredits, setTotalCredits] = useState(100)
  const [usedCredits, setUsedCredits] = useState(0)

  useEffect(() => {
    // Simulate fetching credit data
    // In a real app, you'd fetch this from an API
    setUsedCredits(Math.floor(Math.random() * 50))
  }, [])

  if (!tool) return null

  const ToolComponent = tool.component
  const remainingCredits = totalCredits - usedCredits

  return (
    <Layout title={`${tool.name} | AI Tools`}>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <AppBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start space-y-4 sm:space-y-0 mb-8">
            <Link href="/dashboard/ai-tools">
              <button className="bg-blue-600 hover:bg-blue-700  inline-flex items-center justify-center text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-110">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Tools
              </button>
            </Link>
            <div className="pr-0 sm:pr-8 ">
              <div className="bg-gray-700 rounded-full px-4 py-2 inline-flex items-center justify-center">
                <CreditCardIcon className="h-5 w-5 mr-2 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">{remainingCredits} credits left</span>
              </div>
            </div>
          </div>

            <div className="p-0 sm:p-6">
              <ToolComponent />
            </div>
        </main>
      </div>
    </Layout>
  )
}