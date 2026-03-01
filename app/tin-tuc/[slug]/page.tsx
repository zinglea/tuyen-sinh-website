import Link from 'next/link'
import { ArrowLeft, Calendar, GraduationCap, Eye, Share2 } from 'lucide-react'
import { getNewsBySlug, getAllNews } from '@/utils/docxParser'
import { notFound } from 'next/navigation'
import PptxSlideNav from '@/components/PptxSlideNav'

export const dynamic = 'force-dynamic'

export default async function NewsDetail({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const article = await getNewsBySlug(resolvedParams.slug)

    if (!article) {
        notFound()
    }

    // Format date server-side to avoid hydration mismatch
    const dateObj = new Date(article.date);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <nav className="container mx-auto px-4 py-3 md:py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/tin-tuc" className="flex items-center space-x-2 text-slate-700 hover:text-police-light transition">
                            <div className="p-2 rounded-xl bg-slate-100 hover:bg-police-100 transition">
                                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="font-medium hidden sm:inline">Quay lại</span>
                        </Link>
                        <div className="flex items-center space-x-3">
                            <img src="/logo.png" alt="Logo Công an Cao Bằng" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" />
                            <span className="text-base md:text-xl font-bold text-police-dark tracking-tight uppercase">Tin tức</span>
                        </div>
                        <Link href="/chatbot" className="text-police-light hover:text-police-dark font-semibold transition text-sm md:text-base">
                            Hỏi đáp AI
                        </Link>
                    </div>
                </nav>
            </header>

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
                            {article.author && (
                                <span className="text-slate-500 font-medium flex items-center gap-1.5 md:gap-2 border-l border-slate-300 pl-2 md:pl-3 text-xs md:text-sm">
                                    <GraduationCap className="w-4 h-4" />
                                    {article.author}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-police-dark mb-6 md:mb-8 leading-tight tracking-tight">
                            {article.title}
                        </h1>

                        {/* Content - uses PptxSlideNav for both docx and pptx to enable slide navigation */}
                        <PptxSlideNav contentHtml={article.contentHtml} />

                        {/* Social share + CTA */}
                        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-200">
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
                    </article>
                </div>
            </div>
        </div>
    )
}
