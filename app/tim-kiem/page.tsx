import { getAllNews } from '@/utils/docxParser'
import Link from 'next/link'
import Header from '@/components/Header'
import { Calendar, ChevronRight, SearchX } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q: string }>
}) {
    const resolvedParams = await searchParams;
    const query = resolvedParams.q || ''
    const allNews = await getAllNews()

    // Filter news based on title or excerpt matching query
    const searchResults = query ? allNews.filter(article => {
        const lowerQuery = query.toLowerCase()
        return article.title.toLowerCase().includes(lowerQuery) ||
            article.excerpt.toLowerCase().includes(lowerQuery)
    }) : []

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />

            <main className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-bold text-police-dark mb-2">
                        Kết quả tìm kiếm cho: &quot;<span className="text-police-light">{query}</span>&quot;
                    </h1>
                    <p className="text-slate-500 mb-8">Tìm thấy {searchResults.length} kết quả phù hợp</p>

                    {searchResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {searchResults.map((article) => {
                                const dateObj = new Date(article.date)
                                const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`

                                return (
                                    <Link
                                        key={article.id}
                                        href={`/tin-tuc/${article.slug}`}
                                        className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-police-light/30"
                                    >
                                        <div className="relative h-48 overflow-hidden">
                                            <div className="absolute inset-0 bg-police-dark/10 group-hover:bg-transparent transition-colors z-10"></div>
                                            {article.contentType === 'raw_document' ? (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                                        <span className="text-3xl font-extrabold text-slate-300 uppercase">{article.rawFileUrl?.split('.').pop()}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <img
                                                    src={article.image || '/news-placeholder.jpg'}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                                />
                                            )}

                                            <div className="absolute top-3 left-3 z-20 flex gap-2">
                                                <span className="bg-white/95 backdrop-blur-md text-police-dark text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                                    {article.category}
                                                </span>
                                                {article.contentType === 'raw_document' && (
                                                    <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                                        Tệp tải về
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-5 flex flex-col flex-grow">
                                            <div className="flex items-center text-slate-400 text-xs font-medium mb-3 gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formattedDate}</span>
                                            </div>

                                            <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-police-light transition-colors leading-tight">
                                                {article.title}
                                            </h3>

                                            <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow leading-relaxed">
                                                {article.excerpt}
                                            </p>

                                            <div className="mt-auto flex items-center text-police-light font-bold text-sm group-hover:translate-x-1 transition-transform">
                                                {article.contentType === 'raw_document' ? 'Xem tài liệu' : 'Đọc thêm'} <ChevronRight className="w-4 h-4 ml-1" />
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <SearchX className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Không tìm thấy kết quả</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Rất tiếc, chúng tôi không tìm thấy bài viết hoặc văn bản nào khớp với từ khóa "{query}". Hãy thử lại với từ khóa khác nhé.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
