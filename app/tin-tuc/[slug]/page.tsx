import Link from 'next/link'
import { ArrowLeft, Calendar, GraduationCap } from 'lucide-react'
import { getNewsBySlug, getAllNews } from '@/utils/docxParser'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NewsDetail({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const article = await getNewsBySlug(resolvedParams.slug)

    if (!article) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <nav className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/tin-tuc" className="flex items-center space-x-2 text-slate-700 hover:text-police-light transition">
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Quay lại danh sách</span>
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

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <article className="bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="bg-police-100 text-police-dark font-bold px-4 py-2 rounded-full border border-police-200">
                                {article.category}
                            </span>
                            <span className="text-slate-500 font-medium flex items-center gap-2 border-l border-slate-300 pl-3">
                                <Calendar className="w-5 h-5" />
                                {new Date(article.date).toLocaleDateString('vi-VN')}
                            </span>
                            {article.author && (
                                <span className="text-slate-500 font-medium flex items-center gap-2 border-l border-slate-300 pl-3">
                                    <GraduationCap className="w-5 h-5" />
                                    Tác giả: {article.author}
                                </span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold text-police-dark mb-8 leading-tight tracking-tight">
                            {article.title}
                        </h1>

                        {/* The Document content converted to HTML by Mammoth */}
                        <div
                            className="prose prose-lg prose-slate max-w-none docx-content"
                            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
                        />

                        <div className="mt-12 pt-8 border-t border-slate-200 bg-slate-50 p-6 rounded-2xl">
                            <p className="text-slate-700 font-medium flex items-center gap-3">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-police-accent opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-police-accent"></span>
                                </span>
                                Thắc mắc về nội dung bài viết này?{' '}
                                <Link href="/chatbot" className="text-police-dark font-bold hover:text-police-light underline transition-colors">
                                    Hỏi Chatbot Trợ lý AI ngay
                                </Link>
                            </p>
                        </div>
                    </article>
                </div>
            </div>
        </div>
    )
}
