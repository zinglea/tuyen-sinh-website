'use client'

import { Facebook, Printer, Share2 } from 'lucide-react'

export default function ShareAndPrintBar({ url, title }: { url: string, title?: string }) {
    const handlePrint = () => {
        window.print()
    }

    const shareFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400')
    }

    const shareZalo = () => {
        window.open(`https://sp.zalo.me/plugins/share?link=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400')
    }

    return (
        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600 ml-auto">
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 hover:text-slate-900 transition group"
                aria-label="In bài viết"
            >
                IN
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition">
                    <Printer className="w-4 h-4 text-slate-700" />
                </span>
            </button>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-3">
                Chia sẻ
                <button
                    onClick={shareFacebook}
                    className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-90 transition shadow-sm"
                    aria-label="Chia sẻ Facebook"
                    title="Facebook"
                >
                    <span className="font-bold font-serif text-lg leading-none -mt-0.5">f</span>
                </button>
                <button
                    onClick={shareZalo}
                    className="w-8 h-8 rounded-full bg-[#0068FF] flex items-center justify-center text-white hover:opacity-90 transition shadow-sm text-xs font-bold"
                    aria-label="Chia sẻ Zalo"
                    title="Zalo"
                >
                    Zalo
                </button>
            </div>
        </div>
    )
}
