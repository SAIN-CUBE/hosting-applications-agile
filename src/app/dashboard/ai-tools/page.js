"use client"
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '@/app/dashboard/ai-tools/layout'
import { CreditCardIcon, DocumentTextIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'
import AppBar from '@/components/Dashboard/AppBar'
import { useRouter } from 'next/navigation'

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
    icon: CreditCardIcon,
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
]

export default function AITools() {
  const [userCredits] = useState(100)

  return (
    <Layout title="AI Tools | Tool Box">
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <AppBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Tool Box
          </h1>
          <p className="text-xl text-center mb-12 text-gray-300">
            Explore our cutting-edge AI tools and revolutionize your workflow
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </main>
      </div>
    </Layout>
  )
}

function ToolCard({ tool }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = useCallback((e) => {
    e.preventDefault()
    setIsLoading(true)
    router.prefetch(`/dashboard/ai-tools/${tool.id}`)
    requestAnimationFrame(() => {
      router.push(`/dashboard/ai-tools/${tool.id}`)
    })
  }, [router, tool.id])

  return (
    <motion.div
      className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out h-full cursor-pointer"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
    >
      <div className={`h-2 bg-gradient-to-r ${tool.color}`} />
      <div className="p-6 flex flex-col h-full relative">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </motion.div>
          )}
        </AnimatePresence>
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
  )
}