"use client"
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/app/dashboard/ai-tools/layout'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import AppBar from '@/components/Dashboard/AppBar'
import CNICExtraction from '@/components/Tools/CNICExtraction'
import EmiratesIDProcessing from '@/components/Tools/EmiratesIDProcessing'
import RAGChat from '@/components/Tools/RAGChat'
import ProtectedDashboard from '@/components/Dashboard/ProtectedDashboard'

const tools = {
  cnic: {
    name: 'CNIC Extraction',
    component: CNICExtraction,
  },
  emirates: {
    name: 'Emirates ID Processing',
    component: EmiratesIDProcessing,
  },
  rag: {
    name: 'RAG Chat',
    component: RAGChat,
  },
}

export default function ToolPage() {
  const params = useParams()
  const toolId = params.toolId
  const tool = tools[toolId]

  if (!tool) return null

  const ToolComponent = tool.component

  return (
    <Layout title={`${tool.name} | AI Tools`}>
      <ProtectedDashboard>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <AppBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start space-y-4 sm:space-y-0 mb-8">
            <Link href="/dashboard/ai-tools">
              <button className="bg-blue-600 hover:bg-blue-700 inline-flex items-center justify-center text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-110">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Tools
              </button>
            </Link>
          </div>

          <div className="p-0 sm:p-6">
            <ToolComponent />
          </div>
        </main>
      </div>
      </ProtectedDashboard> 
    </Layout>
  )
}