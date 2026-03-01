'use client'

import { useState, useEffect } from 'react'
import { Eye, Users, TrendingUp } from 'lucide-react'

interface Stats {
    totalVisitors: number
    onlineNow: number
    todayViews: number
}

// Helper: get today's date string in YYYY-MM-DD format
function getTodayKey(): string {
    return new Date().toISOString().split('T')[0]
}

export default function VisitorCounter() {
    const [stats, setStats] = useState<Stats>({
        totalVisitors: 0,
        onlineNow: 0,
        todayViews: 0
    })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        // --- localStorage-based visitor counting (works on Vercel) ---
        const STORAGE_KEY = 'site_stats'
        const SESSION_KEY = 'visited_session'
        const TODAY_KEY = 'today_date'

        // Load existing stats from localStorage
        let savedStats: Stats = { totalVisitors: 0, todayViews: 0, onlineNow: 1 }
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                savedStats = JSON.parse(raw)
            }
        } catch (e) { /* ignore */ }

        const todayKey = getTodayKey()
        const savedTodayKey = localStorage.getItem(TODAY_KEY)

        // Reset daily counter if it's a new day
        if (savedTodayKey !== todayKey) {
            savedStats.todayViews = 0
            localStorage.setItem(TODAY_KEY, todayKey)
        }

        // Check if this is a new session (new tab/browser session)
        const isNewSession = !sessionStorage.getItem(SESSION_KEY)
        if (isNewSession) {
            sessionStorage.setItem(SESSION_KEY, 'true')
            savedStats.totalVisitors += 1
            savedStats.todayViews += 1
        }

        // Online count: always at least 1 (the current viewer)
        savedStats.onlineNow = Math.max(1, savedStats.onlineNow)

        // Save back to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStats))

        setStats(savedStats)
    }, [])

    if (!mounted) return null

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                    Thống kê truy cập
                </h3>
            </div>
            <div className="p-5 grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 text-center group hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-blue-700">{stats.totalVisitors.toLocaleString('vi-VN')}</p>
                    <p className="text-xs text-blue-500 font-semibold mt-1">Tổng lượt</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 text-center group hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <div className="relative">
                            <Eye className="w-5 h-5 text-green-600" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-green-700">{stats.onlineNow}</p>
                    <p className="text-xs text-green-500 font-semibold mt-1">Đang online</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 text-center group hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-amber-700">{stats.todayViews}</p>
                    <p className="text-xs text-amber-500 font-semibold mt-1">Hôm nay</p>
                </div>
            </div>
        </div>
    )
}
