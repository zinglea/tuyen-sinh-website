'use client'

import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface PopularNewsItem {
    id: string
    title: string
    views: number
    slug: string
}

export default function PopularNews() {
    const [news, setNews] = useState<PopularNewsItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPopularNews = async () => {
            const supabase = createClient()
            try {
                // Fetch top 5 news articles ordered by views
                const { data, error } = await supabase
                    .from('news')
                    .select('id, title, views')
                    .order('views', { ascending: false })
                    .limit(6)

                if (data && !error) {
                    setNews(data.map(item => ({
                        ...item,
                        slug: `baiviet-${item.id}` // Using the prefix to match existing routing
                    })))
                }
            } catch (err) {
                console.error("Error fetching popular news", err)
            } finally {
                setLoading(false)
            }
        }

        fetchPopularNews()
    }, [])

    if (loading || news.length === 0) return null

    return (
        <div className="mt-12">
            <h2 className="text-xl font-bold text-police-dark uppercase tracking-wide mb-6 border-b-2 border-police-dark inline-block pb-2">
                Tin đọc nhiều
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item) => (
                    <Link href={`/tin-tuc/${item.slug}`} key={item.id} className="block group">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 group-hover:shadow-md transition h-full flex flex-col justify-between">
                            <p className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 font-medium">
                                <Eye className="w-3.5 h-3.5 text-slate-400" /> {(item.views || 0).toLocaleString('vi-VN')} lượt xem
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
