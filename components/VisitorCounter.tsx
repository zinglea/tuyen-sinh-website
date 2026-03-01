'use client'

import { useState, useEffect } from 'react'
import { Eye, Users, TrendingUp } from 'lucide-react'

interface Stats {
    totalVisitors: number
    onlineNow: number
    todayViews: number
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

        // Get or initialize visitor stats from localStorage
        const stored = localStorage.getItem('visitor_stats')
        const today = new Date().toDateString()

        let data = stored ? JSON.parse(stored) : {
            total: 1245, // Starting seed number
            lastDate: today,
            todayCount: 0,
            firstVisit: Date.now()
        }

        // New day = reset today count
        if (data.lastDate !== today) {
            data.lastDate = today
            data.todayCount = 0
        }

        // Check if this is a new session
        const sessionKey = sessionStorage.getItem('visited')
        if (!sessionKey) {
            sessionStorage.setItem('visited', '1')
            data.total += 1
            data.todayCount += 1
        }

        localStorage.setItem('visitor_stats', JSON.stringify(data))

        // Simulate online users (2-8 range based on time)
        const hour = new Date().getHours()
        const baseOnline = hour >= 8 && hour <= 22 ? 3 : 1
        const online = baseOnline + Math.floor(Math.random() * 5)

        setStats({
            totalVisitors: data.total,
            onlineNow: online,
            todayViews: data.todayCount
        })
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
