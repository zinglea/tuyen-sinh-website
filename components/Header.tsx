'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    return (
        <header className="bg-white sticky top-0 z-50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]">
            {/* Top Banner */}
            <div className="bg-police-dark text-white py-4 md:py-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-police-light/20 to-transparent skew-x-12 transform translate-x-10"></div>
                <div className="container mx-auto px-4 flex items-center justify-center md:justify-start gap-4 md:gap-6 relative z-10">
                    <img src="/logo.png" alt="CAND Logo" className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                    <div className="flex flex-col text-center md:text-left">
                        <h2 className="text-sm md:text-xl font-bold uppercase tracking-widest text-police-accent mb-0.5 md:mb-1 drop-shadow-md">
                            Phòng Tổ chức cán bộ - Công an tỉnh Cao Bằng
                        </h2>
                        <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight drop-shadow-lg leading-tight">
                            CỔNG THÔNG TIN TUYỂN SINH
                        </h1>
                    </div>
                </div>
            </div>

            {/* Navigation & Search Bar */}
            <nav className="bg-white/80 backdrop-blur-md text-police-nav border-b border-gray-100 relative">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-police-dark via-police-accent to-police-light"></div>
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between py-2 gap-4">
                        {/* Links */}
                        <ul className="flex flex-wrap items-center justify-center md:justify-start space-x-1 sm:space-x-4 md:space-x-6 text-xs sm:text-sm md:text-base font-bold uppercase tracking-wide">
                            <li>
                                <Link href="/" className="inline-block py-2 md:py-4 px-2 hover:text-police-light transition-colors relative group">
                                    Trang chủ
                                    <span className="absolute -bottom-[1px] left-0 w-0 h-1 bg-police-accent rounded-t-md opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-300"></span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/gioi-thieu" className="inline-block py-2 md:py-4 px-2 hover:text-police-light transition-colors relative group">
                                    Giới thiệu
                                    <span className="absolute -bottom-[1px] left-0 w-0 h-1 bg-police-accent rounded-t-md opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-300"></span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/tin-tuc" className="inline-block py-2 md:py-4 px-2 hover:text-police-light transition-colors relative group">
                                    Tin tức & Sự kiện
                                    <span className="absolute -bottom-[1px] left-0 w-0 h-1 bg-police-accent rounded-t-md opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-300"></span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/van-ban" className="inline-block py-2 md:py-4 px-2 hover:text-police-light transition-colors relative group">
                                    Văn bản, Quy định
                                    <span className="absolute -bottom-[1px] left-0 w-0 h-1 bg-police-accent rounded-t-md opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-300"></span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/chatbot" className="inline-block py-2 md:py-4 px-2 hover:text-police-light transition-colors relative group">
                                    Trợ lý AI
                                    <span className="absolute -bottom-[1px] left-0 w-0 h-1 bg-police-accent rounded-t-md opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-300"></span>
                                </Link>
                            </li>
                        </ul>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative w-full lg:w-72 max-w-sm mx-auto lg:mx-0">
                            <input
                                type="text"
                                placeholder="Tìm kiếm tin tức, văn bản..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-100 hover:bg-slate-200 focus:bg-white border border-transparent focus:border-police-light text-slate-700 text-sm rounded-full pl-4 pr-10 py-2.5 transition-all outline-none shadow-inner focus:shadow-md"
                            />
                            <button
                                type="submit"
                                aria-label="Tìm kiếm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-police-light text-white hover:bg-police-dark transition-colors"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </nav>
        </header>
    )
}
