import Sidebar from '@/components/Dashboard/Sidebar'
import Head from 'next/head'

export default function Layout({ children, title = 'AI Tools Integration' }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="AI Tools Integration Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col bg-gray-900">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pl-4 sm:pl-4 pt-1">
          {children}
        </main>
      </div>
    </div>
    </>
  )
}