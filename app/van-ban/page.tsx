import { getAllNews } from '@/utils/docxParser'
import { getSupabaseDocuments } from '@/utils/supabase/data'
import Header from '@/components/Header'
import VanBanClient from './VanBanClient'

export const dynamic = 'force-dynamic'

export default async function VanBanPage() {
    const [allNews, supabaseDocs] = await Promise.all([
        getAllNews(),
        getSupabaseDocuments(),
    ])

    // Local documents
    const localDocs = allNews
        .filter(article => {
            if (article.contentType === 'raw_document') return true
            const cat = article.category.toLowerCase()
            return cat.includes('văn bản') || cat.includes('quy định') || cat.includes('hướng dẫn')
        })
        .map(article => ({
            id: `local-${article.id}`,
            title: article.title,
            category: article.category,
            date: article.date,
            fileType: article.contentType === 'raw_document' ? 'pdf' : 'docx',
            linkUrl: `/tin-tuc/${article.slug}`,
            linkType: 'internal' as const,
            excerpt: article.excerpt || '',
            author: article.author || '',
            document_number: '',
            summary: article.excerpt || '',
            issuing_authority: article.author || '',
            publishing_level: '',
            issued_date: article.date,
            effective_date: '',
            status: 'Còn hiệu lực',
        }))

    // Supabase documents
    const cloudDocs = supabaseDocs.map(doc => ({
        id: `cloud-${doc.id}`,
        title: doc.title,
        category: doc.category || 'Khác',
        date: doc.created_at,
        fileType: doc.file_type || '',
        linkUrl: doc.file_url,
        linkType: 'external' as const,
        excerpt: '',
        author: '',
        document_number: (doc as any).document_number || '',
        summary: (doc as any).summary || '',
        issuing_authority: (doc as any).issuing_authority || '',
        publishing_level: (doc as any).publishing_level || '',
        issued_date: (doc as any).issued_date || doc.created_at,
        effective_date: (doc as any).effective_date || '',
        status: (doc as any).status || 'Còn hiệu lực',
    }))

    const allDocs = [...cloudDocs, ...localDocs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />
            <VanBanClient documents={allDocs} />
        </div>
    )
}
