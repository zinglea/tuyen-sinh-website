'use client'

import { useState, useEffect } from 'react'

interface Stats {
    totalVisitors: number
    onlineNow: number
    todayViews: number
    weekViews: number
    monthViews: number
}

export default function VisitorCounter() {
    const [stats, setStats] = useState<Stats>({
        totalVisitors: 0,
        onlineNow: 0,
        todayViews: 0,
        weekViews: 0,
        monthViews: 0
    })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Generate a unique session ID per browser tab
        let sessionId = sessionStorage.getItem('counter_session_id')
        if (!sessionId) {
            sessionId = 'sid-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now()
            sessionStorage.setItem('counter_session_id', sessionId)
        }

        const isNewVisit = !sessionStorage.getItem('counted_visit')

        const fetchStats = async () => {
            try {
                const action = isNewVisit ? 'new_visit' : 'ping'
                if (isNewVisit) {
                    sessionStorage.setItem('counted_visit', 'true')
                }

                const res = await fetch(`/api/stats?action=${action}&session=${sessionId}`, {
                    method: 'POST',
                    cache: 'no-store'
                })

                if (res.ok) {
                    const data = await res.json()
                    setStats({
                        totalVisitors: data.totalVisitors || 0,
                        todayViews: data.todayViews || 0,
                        weekViews: data.weekViews || 0,
                        monthViews: data.monthViews || 0,
                        onlineNow: data.onlineNow || 1
                    })
                }
            } catch (error) {
                console.error('Lỗi khi tải thống kê truy cập:', error)
            }
        }

        // Initial fetch
        fetchStats()

        // Ping every 1 minute to stay online and get fresh counts
        const interval = setInterval(fetchStats, 60000)
        return () => clearInterval(interval)
    }, [])

    if (!mounted) return null

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-[15px] font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-3">
                    <div className="w-1.5 h-5 bg-green-500 rounded-full"></div>
                    Thống kê truy cập
                </h3>
            </div>
            <div className="p-0">
                <ul className="divide-y divide-slate-100">
                    <li className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition">
                        <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            Đang truy cập
                        </span>
                        <span className="text-base font-extrabold text-green-600">{stats.onlineNow.toLocaleString('vi-VN')}</span>
                    </li>
                    <li className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition">
                        <span className="text-sm font-semibold text-slate-600">Hôm nay</span>
                        <span className="text-base font-bold text-slate-800">{stats.todayViews.toLocaleString('vi-VN')}</span>
                    </li>
                    <li className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition">
                        <span className="text-sm font-semibold text-slate-600">Trong tuần</span>
                        <span className="text-base font-bold text-slate-800">{stats.weekViews.toLocaleString('vi-VN')}</span>
                    </li>
                    <li className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition">
                        <span className="text-sm font-semibold text-slate-600">Tháng hiện tại</span>
                        <span className="text-base font-bold text-slate-800">{stats.monthViews.toLocaleString('vi-VN')}</span>
                    </li>
                    <li className="flex items-center justify-between px-6 py-4 bg-slate-50/50">
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[11px]">Tổng truy cập</span>
                        <span className="text-xl font-black text-blue-600">{stats.totalVisitors.toLocaleString('vi-VN')}</span>
                    </li>
                </ul>
            </div>
        </div>
    )
}
