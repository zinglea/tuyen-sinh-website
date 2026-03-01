import Link from 'next/link'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import NewsClient from './NewsClient'
import { getAllNews } from '@/utils/docxParser'

export const dynamic = 'force-dynamic' // Ensure it rescans the directory on request (in dev)

export default async function TinTuc() {
  const allData = await getAllNews()
  const newsData = allData.filter(article => article.contentType !== 'raw_document')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-slate-700 hover:text-police-light transition">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Quay lại trang chủ</span>
            </Link>
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Logo Công an Cao Bằng" className="w-10 h-10 object-contain drop-shadow-md" />
              <span className="text-xl font-bold text-police-dark tracking-tight uppercase">Tin tức tuyển sinh</span>
            </div>
            <Link href="/chatbot" className="text-police-light hover:text-police-dark font-semibold transition">
              Hỏi đáp AI
            </Link>
          </div>
        </nav>
      </header>

      {/* Client Component for filtering and displaying grid */}
      <NewsClient newsData={newsData} />
    </div>
  )
}
