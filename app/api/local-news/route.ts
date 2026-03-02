import { NextResponse } from 'next/server'
import { getAllNews } from '@/utils/docxParser'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const allNews = await getAllNews()

        // Return all local news (both articles and raw documents)
        const simplified = allNews.map(item => ({
            id: item.id,
            title: item.title,
            date: item.date,
            category: item.category,
            excerpt: item.excerpt,
            image: item.image,
            author: item.author,
            contentType: item.contentType,
            slug: item.slug,
            rawFileUrl: (item as any).rawFileUrl || '',
        }))

        return NextResponse.json({ news: simplified })
    } catch (e) {
        console.error('local-news API error:', e)
        return NextResponse.json({ news: [] })
    }
}
