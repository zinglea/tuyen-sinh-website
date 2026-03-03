import Link from 'next/link'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import NewsClient from './NewsClient'
import { getAllNews } from '@/utils/docxParser'
import { getSupabaseNews } from '@/utils/supabase/data'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

export default async function TinTuc() {
  // Fetch from both sources in parallel
  const [allLocalData, supabaseNews] = await Promise.all([
    getAllNews(),
    getSupabaseNews(),
  ])

  // Local news (exclude raw documents)
  const localNews = allLocalData.filter(article => article.contentType !== 'raw_document')

  // Convert Supabase news to same format as local news
  const supabaseFormatted = supabaseNews.map(item => ({
    id: item.id,
    slug: `baiviet-${item.id}`,
    title: item.title,
    date: item.created_at,
    category: item.category || 'Tin tức',
    excerpt: item.content?.substring(0, 150) || '',
    image: item.image_url || '/logo.png',
    contentType: 'supabase_news' as const,
    author: item.author || 'Admin',
    contentHtml: '',
  }))

  // Combine: Supabase news first, then local
  const combinedNews = [...supabaseFormatted, ...localNews]

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <Header />

      {/* Client Component for filtering and displaying grid */}
      <NewsClient newsData={combinedNews} />
    </div>
  )
}
