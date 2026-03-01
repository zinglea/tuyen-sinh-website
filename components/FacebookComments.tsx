'use client'

import { useEffect, useState } from 'react'

interface FacebookCommentsProps {
    href: string; // The URL to link the comments to
    width?: string;
    numPosts?: number;
}

export default function FacebookComments({ href, width = '100%', numPosts = 5 }: FacebookCommentsProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Inject the Facebook SDK if it doesn't exist
        if (!window.document.getElementById('facebook-jssdk')) {
            const js = window.document.createElement('script')
            js.id = 'facebook-jssdk'
            js.src = 'https://connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v19.0'
            window.document.body.appendChild(js)
        } else if (window.FB) {
            // IfSDK is already loaded but we navigated client-side, force parse
            window.FB.XFBML.parse()
        }
    }, [href]) // Re-run when href changes

    if (!mounted) return <div className="animate-pulse h-32 bg-slate-100 rounded-xl w-full"></div>

    return (
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg p-5 border border-slate-100 mt-8 overflow-hidden">
            <h3 className="text-xl font-bold text-police-dark uppercase tracking-wide border-b border-slate-200 pb-3 mb-5 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                Bình luận & Góp ý
            </h3>

            {/* FB Comments Plugin container */}
            <div className="w-full relative overflow-x-auto min-h-[150px]">
                <div className="fb-comments" data-href={href} data-width={width} data-numposts={numPosts.toString()}></div>
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">
                Vui lòng sử dụng tài khoản Facebook để bình luận. Các bình luận vi phạm pháp luật, thuần phong mỹ tục sẽ bị quản trị viên xóa & chặn vĩnh viễn.
            </p>
        </div>
    )
}

// Ensure TypeScript knows about window.FB
declare global {
    interface Window {
        FB: any;
    }
}
