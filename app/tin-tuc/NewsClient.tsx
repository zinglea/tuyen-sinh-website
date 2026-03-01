'use client'

import Link from 'next/link'
import { ArrowLeft, Calendar, GraduationCap, Newspaper } from 'lucide-react'
import { useState } from 'react'

export default function NewsClient({ newsData }: { newsData: any[] }) {
    const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả')

    // Collect unique categories
    const categorySet = new Set(newsData.map(news => news.category))
    const categories = ['Tất cả', ...Array.from(categorySet)]

    const filteredNews = selectedCategory === 'Tất cả'
        ? newsData
        : newsData.filter(news => news.category === selectedCategory)

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Page Title */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-police-dark mb-4 uppercase tracking-tight">Cổng tin tức & thông báo</h1>
                <p className="text-xl text-slate-600 font-medium">Cập nhật thông tin tuyển sinh mới nhất từ Công an tỉnh Cao Bằng</p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-3 mb-8 justify-center">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-6 py-2 rounded-full font-semibold transition-all ${selectedCategory === category
                                ? 'bg-police-dark text-white shadow-lg shadow-police-dark/30 scale-105'
                                : 'bg-white text-slate-700 hover:bg-slate-100 shadow border border-transparent hover:border-slate-200'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* News Grid */}
            {filteredNews.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <Newspaper className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-xl">Chưa có bài viết nào trong chuyên mục này.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNews.map(news => (
                        <Link
                            key={news.id}
                            href={`/tin-tuc/${news.slug}`}
                            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100 group block outline-none"
                        >
                            <div className="h-48 bg-slate-100 relative overflow-hidden">
                                <img
                                    src={news.image}
                                    alt={news.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-police-light/20 to-police-dark/20 hidden items-center justify-center">
                                    <Newspaper className="w-20 h-20 text-police-dark/30" />
                                </div>
                            </div>
                            <div className="p-6 flex flex-col h-[calc(100%-12rem)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-police-100 text-police-dark text-xs font-bold px-3 py-1 rounded-full border border-police-200">
                                        {news.category}
                                    </span>
                                    <span className="text-slate-500 text-sm flex items-center gap-1 font-medium">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(news.date).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-police-dark mb-3 line-clamp-2 group-hover:text-police-light transition-colors">
                                    {news.title}
                                </h3>
                                <p className="text-slate-600 line-clamp-3 mb-4 font-medium leading-relaxed flex-grow">
                                    {news.excerpt}
                                </p>
                                <span className="text-police-accent font-bold group-hover:text-yellow-600 transition flex items-center gap-1 group-hover:gap-2 mt-auto">
                                    Đọc thêm <span className="text-xl leading-none">&rarr;</span>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
