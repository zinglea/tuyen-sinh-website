'use client'

import { useState } from 'react'
import { MessageCircle, X, Bot, FunctionSquare as Facebook, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="fixed bottom-6 right-6 z-[100] print:hidden">
            {/* Menu Dropdown Menu */}
            <div className={`absolute bottom-16 right-0 mb-4 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 visible' : 'scale-90 opacity-0 invisible'}`}>
                <div className="p-4 bg-gradient-to-r from-police-dark to-police-light text-white rounded-t-2xl">
                    <h3 className="font-bold text-sm">Hỗ trợ trực tuyến</h3>
                    <p className="text-xs text-blue-100 mt-1">Chọn kênh hỗ trợ bạn muốn</p>
                </div>
                <div className="p-2 w-64">
                    <Link
                        href="/chatbot"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 rounded-xl transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-800">Trợ lý AI</span>
                            <span className="block text-xs text-slate-500">Hỏi đáp tự động 24/7</span>
                        </div>
                    </Link>

                    <a
                        href="https://zalo.me/0206385xxxx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 rounded-xl transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform font-bold text-xs">
                            Zalo
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-800">Zalo OA</span>
                            <span className="block text-xs text-slate-500">Chat ngay qua Zalo</span>
                        </div>
                    </a>

                    <a
                        href="https://m.me/tuyensinhcacaobang"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 rounded-xl transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Facebook className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-800">Facebook</span>
                            <span className="block text-xs text-slate-500">Gửi tin nhắn Messenger</span>
                        </div>
                    </a>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-police-dark text-white'}`}
                aria-label="Mở menu hỗ trợ"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                {!isOpen && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </button>
        </div>
    )
}
