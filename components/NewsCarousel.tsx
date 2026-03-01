'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, ChevronRight } from 'lucide-react'

export default function NewsCarousel({ newsList }: { newsList: any[] }) {
    const [activeIndex, setActiveIndex] = useState(0)

    // Auto-play interval
    useEffect(() => {
        if (newsList.length <= 1) return

        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % newsList.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [newsList.length])

    if (!newsList || newsList.length === 0) {
        return <p className="text-gray-500 text-center py-10">Đang cập nhật tin tức...</p>
    }

    const featured = newsList[activeIndex]

    return (
        <div className="flex flex-col lg:flex-row h-[450px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-white/40 ring-1 ring-black/5">
            {/* Featured Main Focus (Left Side) */}
            <div className="lg:w-2/3 h-full relative group transition-all duration-500 ease-in-out">
                <div className="absolute inset-0 bg-black">
                    <img
                        src={featured.image}
                        alt={featured.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-105 transition-all duration-[800ms] ease-out"
                    />
                </div>

                {/* Gradient Overlay for Text Visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-police-dark/95 via-police-dark/40 to-transparent"></div>

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 z-10">
                    <span className="inline-block bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs font-bold px-3 py-1 rounded-full mb-4">
                        {featured.category}
                    </span>
                    <Link href={`/tin-tuc/${featured.slug}`}>
                        <h4 className="text-3xl md:text-4xl font-extrabold text-white mb-3 hover:text-police-accent transition-colors drop-shadow-md leading-tight line-clamp-3">
                            {featured.title}
                        </h4>
                    </Link>
                    <p className="text-gray-300 font-medium mb-4 flex items-center gap-1.5 drop-shadow-sm">
                        <Calendar className="w-4 h-4 text-police-accent" /> {new Date(featured.date).toLocaleDateString('vi-VN')}
                    </p>
                    <div className="w-12 h-1 bg-police-accent rounded-full transition-all duration-300 group-hover:w-24"></div>
                </div>
            </div>

            {/* Thumbnails Sidebar (Right Side) */}
            <div className="lg:w-1/3 bg-slate-50 relative h-full flex flex-col">
                <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between z-10">
                    <h3 className="font-bold text-police-nav uppercase tracking-wide text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-police-accent animate-pulse"></span>
                        Tin Nổi Bật
                    </h3>
                    <Link href="/tin-tuc" className="text-xs font-semibold text-police-light hover:text-police-dark flex items-center">
                        Tất cả <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

                <div className="overflow-y-auto flex-1 custom-scrollbar scroll-smooth">
                    <ul className="p-3 space-y-2">
                        {newsList.map((news, index) => (
                            <li key={news.id}>
                                <Link
                                    href={`/tin-tuc/${news.slug}`}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 group ${index === activeIndex
                                        ? 'bg-white shadow-md ring-1 ring-police-accent/50'
                                        : 'hover:bg-white/60 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                                        <div className={`absolute inset-0 bg-police-dark/20 z-10 transition-opacity ${index === activeIndex ? 'opacity-0' : 'group-hover:opacity-0'}`}></div>
                                        <img
                                            src={news.image}
                                            alt={news.title}
                                            className={`w-full h-full object-cover transition-transform duration-500 ${index === activeIndex ? 'scale-110' : 'group-hover:scale-110'}`}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className={`font-semibold text-sm leading-snug line-clamp-2 transition-colors ${index === activeIndex ? 'text-police-dark' : 'text-gray-600 group-hover:text-police-light'
                                            }`}>
                                            {news.title}
                                        </h5>
                                        <span className="text-[11px] text-gray-400 mt-1 block font-medium">
                                            {new Date(news.date).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}
