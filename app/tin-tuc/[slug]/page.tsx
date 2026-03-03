import Link from 'next/link'
import { ArrowLeft, Calendar, GraduationCap, Eye, Share2, PenTool } from 'lucide-react'
import { getNewsBySlug, getAllNews } from '@/utils/docxParser'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import PptxSlideNav from '@/components/PptxSlideNav'
import Header from '@/components/Header'
import FacebookComments from '@/components/FacebookComments'
import PdfViewerClient from '@/components/PdfViewerClient'
import ShareAndPrintBar from '@/components/ShareAndPrintBar'
import ArticleViewTracker from '@/components/ArticleViewTracker'
import PopularNews from '@/components/PopularNews'

export const dynamic = 'force-dynamic'

export default async function NewsDetail({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    let article: any = null;

    if (slug.startsWith('baiviet-')) {
        const id = slug.replace('baiviet-', '');
        const supabase = await createClient();
        const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
        if (data && !error) {
            article = {
                id: data.id,
                title: data.title,
                date: data.created_at,
                category: data.category || 'Tin tức',
                author: data.author || 'Admin',
                contentType: 'supabase_news',
                contentHtml: data.content || '',
                rawFileUrl: '',
                slug: slug,
                tags: data.tags || ''
            }
        }
    } else {
        article = await getNewsBySlug(slug)
    }

    if (!article) {
        notFound()
    }

    // Format date server-side to avoid hydration mismatch
    const dateObj = new Date(article.date);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <Header />

            <div className="container mx-auto px-4 py-6 md:py-12">
                <div className="max-w-4xl mx-auto">
                    <article className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-5 md:p-10 border border-slate-100">
                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
                            <span className="bg-police-100 text-police-dark font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-police-200 text-xs md:text-sm">
                                {article.category}
                            </span>
                            <span className="text-slate-500 font-medium flex items-center gap-1.5 md:gap-2 border-l border-slate-300 pl-2 md:pl-3 text-xs md:text-sm">
                                <Calendar className="w-4 h-4" />
                                {formattedDate}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-police-dark mb-6 md:mb-8 leading-tight tracking-tight">
                            {article.title}
                        </h1>

                        {article.contentType === 'raw_document' && article.rawFileUrl?.toLowerCase().endsWith('.pdf') ? (
                            <div className="flex flex-col gap-6">
                                <PdfViewerClient fileUrl={`/api/pdf?file=${encodeURIComponent(article.rawFileUrl.split('/').pop() || '')}`} />
                                <div className="text-center">
                                    <a href={article.rawFileUrl} download className="inline-block px-8 py-3 bg-police-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                        ⬇️ Tải file gốc về máy
                                    </a>
                                </div>
                            </div>
                        ) : article.contentType === 'supabase_news' ? (
                            <div className="prose prose-slate max-w-none text-justify article-content
                                prose-headings:font-bold prose-headings:text-police-dark 
                                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                                prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto"
                                dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
                        ) : (
                            <PptxSlideNav contentHtml={article.contentHtml} />
                        )}

                        {/* Author at the bottom */}
                        {article.author && (
                            <div className="mt-12 mb-8 flex justify-end">
                                <div className="inline-flex flex-col items-center border-t border-slate-200 pt-6 px-4">
                                    <PenTool className="w-5 h-5 text-slate-400 mb-2 rotate-180" />
                                    <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Tác giả bài viết</span>
                                    <span className="text-lg text-slate-700 font-serif italic">{article.author}</span>
                                </div>
                            </div>
                        )}

                        {/* Tags & Action Bar */}
                        <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 border-y border-slate-100">
                            <div className="flex-1">
                                {article.tags && article.tags.trim() !== '' && (
                                    <div className="flex items-center flex-wrap gap-2">
                                        <span className="text-sm font-semibold text-slate-500 mr-1">Tag</span>
                                        {article.tags.split(/,|#/).map((tag: string) => tag.trim()).filter(Boolean).map((t: string, idx: number) => (
                                            <span key={idx} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-slate-200 transition cursor-default">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <ShareAndPrintBar url={`https://tuyensinhcaobang.vn/tin-tuc/${article.slug}`} title={article.title} />
                        </div>

                        {/* Social share + CTA */}
                        <div className="mt-8 pt-6 md:pt-8 border-t border-slate-200">
                            {/* Social links */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                <a
                                    href="https://www.facebook.com/tuyensinhcacaobang"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1877F2] text-white text-xs font-bold hover:opacity-90 transition"
                                >
                                    <span>f</span> Facebook
                                </a>
                                <a
                                    href="https://zalo.me/0206385xxxx"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white text-xs font-bold hover:opacity-90 transition"
                                >
                                    Zalo
                                </a>
                            </div>

                            {/* Chatbot CTA */}
                            <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 md:p-6 rounded-2xl border border-slate-100">
                                <p className="text-slate-700 font-medium flex flex-wrap items-center gap-2 md:gap-3 text-sm md:text-base">
                                    <span className="flex h-3 w-3 relative flex-shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-police-accent opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-police-accent"></span>
                                    </span>
                                    Thắc mắc về nội dung bài viết?{' '}
                                    <Link href="/chatbot" className="text-police-dark font-bold hover:text-police-light underline transition-colors">
                                        Hỏi Chatbot Trợ lý AI ngay
                                    </Link>
                                </p>
                            </div>
                        </div>

                        <FacebookComments href={`https://tuyensinhcaobang.vn/tin-tuc/${article.slug}`} />
                    </article>
                </div>
            </div>

            {/* Popular News Section */}
            <div className="container mx-auto px-4 pb-12">
                <div className="max-w-4xl mx-auto">
                    <PopularNews />
                </div>
            </div>

            {article.id && <ArticleViewTracker articleId={article.id} category={article.category || 'Tin tức'} />}
        </div>
    )
}
