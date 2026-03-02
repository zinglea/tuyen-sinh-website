import { createClient } from '@/utils/supabase/server'
import { Newspaper, FileText, Eye, TrendingUp, HardDrive, Clock, Shield, BarChart3, Activity, Users } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Fetch counts
    const { count: newsCount } = await supabase.from('news').select('*', { count: 'exact', head: true })
    const { count: docsCount } = await supabase.from('documents').select('*', { count: 'exact', head: true })

    // Recent news
    const { data: recentNews } = await supabase.from('news').select('id, title, created_at').order('created_at', { ascending: false }).limit(5)

    // Recent documents
    const { data: recentDocs } = await supabase.from('documents').select('id, title, file_type, created_at').order('created_at', { ascending: false }).limit(5)

    const { data: { user } } = await supabase.auth.getUser()

    const now = new Date()
    const hour = now.getHours()
    const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

    const stats = [
        { title: 'Bài viết', count: newsCount || 0, icon: Newspaper, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20', href: '/admin/news' },
        { title: 'Văn bản', count: docsCount || 0, icon: FileText, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20', href: '/admin/documents' },
        { title: 'Tổng nội dung', count: (newsCount || 0) + (docsCount || 0), icon: BarChart3, color: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20', href: '#' },
    ]

    const formatDate = (d: string) => {
        const dt = new Date(d)
        return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">{greeting}, Admin 👋</h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        <Shield className="w-3.5 h-3.5 inline mr-1" />
                        {user?.email} · <span className="text-emerald-600">🟢 Online</span>
                    </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                    <p className="flex items-center gap-1 justify-end"><Clock className="w-3.5 h-3.5" /> {now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="mt-0.5">{now.toLocaleTimeString('vi-VN')}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {stats.map((card) => (
                    <Link key={card.title} href={card.href} className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-lg ${card.shadow} hover:shadow-xl transition-all group`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{card.title}</p>
                                <p className="text-4xl font-extrabold text-slate-800 mt-2 group-hover:text-blue-600 transition">{card.count}</p>
                            </div>
                            <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center shadow-lg ${card.shadow}`}>
                                <card.icon className="w-7 h-7 text-white" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent News */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <Newspaper className="w-4 h-4 text-blue-500" /> Bài viết gần đây
                        </h2>
                        <Link href="/admin/news" className="text-xs text-blue-600 font-semibold hover:underline">Xem tất cả →</Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {(recentNews || []).length > 0 ? (recentNews || []).map((item: any) => (
                            <div key={item.id} className="px-5 py-3 hover:bg-slate-50/50 transition">
                                <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.created_at)}</p>
                            </div>
                        )) : (
                            <div className="px-5 py-8 text-center text-slate-400 text-sm">Chưa có bài viết nào.</div>
                        )}
                    </div>
                </div>

                {/* Recent Documents */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-500" /> Văn bản gần đây
                        </h2>
                        <Link href="/admin/documents" className="text-xs text-emerald-600 font-semibold hover:underline">Xem tất cả →</Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {(recentDocs || []).length > 0 ? (recentDocs || []).map((item: any) => (
                            <div key={item.id} className="px-5 py-3 hover:bg-slate-50/50 transition flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.file_type === 'pdf' ? 'bg-red-50 text-red-600' : item.file_type === 'docx' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{item.file_type}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.created_at)}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="px-5 py-8 text-center text-slate-400 text-sm">Chưa có văn bản nào.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-500" /> Thao tác nhanh
                    </h2>
                    <div className="space-y-2">
                        <Link href="/admin/news" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition group">
                            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition"><Newspaper className="w-4 h-4 text-blue-600" /></div>
                            <div><p className="text-sm font-semibold text-slate-700">Đăng bài viết mới</p><p className="text-xs text-slate-400">Upload Word/PDF hoặc soạn thảo</p></div>
                        </Link>
                        <Link href="/admin/documents" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition group">
                            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition"><FileText className="w-4 h-4 text-emerald-600" /></div>
                            <div><p className="text-sm font-semibold text-slate-700">Upload văn bản</p><p className="text-xs text-slate-400">Thêm văn bản & quy định</p></div>
                        </Link>
                        <a href="/" target="_blank" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-purple-50 hover:border-purple-200 transition group">
                            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition"><Eye className="w-4 h-4 text-purple-600" /></div>
                            <div><p className="text-sm font-semibold text-slate-700">Xem trang chủ</p><p className="text-xs text-slate-400">Mở website ở tab mới</p></div>
                        </a>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-orange-500" /> Hệ thống
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Nền tảng</span>
                            <span className="text-sm font-semibold text-slate-700">Next.js + Supabase</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Lưu trữ</span>
                            <span className="text-sm font-semibold text-emerald-600">☁️ Supabase Storage</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Trạng thái</span>
                            <span className="text-sm font-semibold text-emerald-600">🟢 Hoạt động tốt</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Xác thực</span>
                            <span className="text-sm font-semibold text-emerald-600">🔒 Supabase Auth</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Database</span>
                            <span className="text-sm font-semibold text-blue-600">PostgreSQL</span>
                        </div>
                    </div>
                </div>

                {/* Guide */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" /> Hướng dẫn đăng bài
                    </h2>
                    <div className="space-y-2 text-xs text-slate-500">
                        <div className="flex items-start gap-2 p-2 bg-blue-50/50 rounded-lg">
                            <span className="text-blue-500 font-bold shrink-0">1.</span>
                            <p>Soạn bài trong <strong>Word</strong>, dùng emoji (✅❌📌) thay icon Symbol.</p>
                        </div>
                        <div className="flex items-start gap-2 p-2 bg-blue-50/50 rounded-lg">
                            <span className="text-blue-500 font-bold shrink-0">2.</span>
                            <p>Chú thích ảnh: viết <code className="bg-white px-1 rounded text-[10px]">##chú thích##</code> dưới ảnh.</p>
                        </div>
                        <div className="flex items-start gap-2 p-2 bg-blue-50/50 rounded-lg">
                            <span className="text-blue-500 font-bold shrink-0">3.</span>
                            <p>Chèn video: viết <code className="bg-white px-1 rounded text-[10px]">##URL YouTube##</code></p>
                        </div>
                        <div className="flex items-start gap-2 p-2 bg-blue-50/50 rounded-lg">
                            <span className="text-blue-500 font-bold shrink-0">4.</span>
                            <p>Vào <strong>Admin → Tin tức → Upload file</strong> → Xem trước → Đăng bài.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
