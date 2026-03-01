import { getAllNews } from '@/utils/docxParser'
import Link from 'next/link'
import Header from '@/components/Header'
import { Calendar, ChevronRight, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VanBanPage() {
    const allNews = await getAllNews()

    // Filter news that belong to "Văn bản", "Quy định", "Thông báo" or are raw documents
    const documents = allNews.filter(article => {
        if (article.contentType === 'raw_document') return true;
        const cat = article.category.toLowerCase()
        return cat.includes('văn bản') || cat.includes('quy định') || cat.includes('thông báo') || cat.includes('hướng dẫn')
    })

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />

            <div className="bg-police-dark text-white py-12 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-police-light/20 to-transparent skew-x-12 transform translate-x-10"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <FileText className="w-8 h-8 text-police-accent" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight drop-shadow-lg mb-2">
                        Văn Bản & Quy Định
                    </h1>
                    <p className="text-blue-100 max-w-2xl mx-auto">
                        Hệ thống tra cứu các văn bản pháp luật, quy định, hướng dẫn liên quan đến công tác Tuyển sinh CAND.
                    </p>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-5xl mx-auto">
                    {documents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {documents.map((article) => {
                                const dateObj = new Date(article.date)
                                const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`

                                return (
                                    <Link
                                        key={article.id}
                                        href={`/tin-tuc/${article.slug}`}
                                        className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-police-light/30"
                                    >
                                        <div className="p-6 flex flex-col flex-grow">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex gap-2">
                                                    <span className={`${article.contentType === 'raw_document' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'} text-xs font-bold px-3 py-1.5 rounded-full border uppercase tracking-wide`}>
                                                        {article.category}
                                                    </span>
                                                    {article.contentType === 'raw_document' && (
                                                        <span className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-bold px-3 py-1.5 rounded-full border">
                                                            Tệp đính kèm
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center text-slate-400 text-xs font-medium gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{formattedDate}</span>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-police-light transition-colors leading-relaxed">
                                                {article.title}
                                            </h3>

                                            {article.contentType === 'raw_document' && article.author && (
                                                <div className="text-sm font-semibold text-police-dark mb-3">
                                                    Cơ quan ban hành: <span className="text-slate-600 font-normal">{article.author}</span>
                                                </div>
                                            )}

                                            <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                                                {article.excerpt}
                                            </p>

                                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                                                <span className="text-police-light font-bold text-sm group-hover:underline">
                                                    {article.contentType === 'raw_document' ? 'Xem tài liệu' : 'Xem chi tiết'}
                                                </span>
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-police-light group-hover:text-white transition-colors">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có văn bản nào</h3>
                            <p className="text-slate-500">
                                Các văn bản và quy định sẽ được cập nhật trong thời gian sớm nhất.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
