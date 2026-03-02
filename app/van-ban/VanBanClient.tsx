'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, ArrowLeft, Calendar, FileText, Eye, Download, ChevronRight, X } from 'lucide-react'

interface DocItem {
    id: string
    title: string
    category: string
    date: string
    fileType: string
    linkUrl: string
    linkType: 'internal' | 'external'
    excerpt: string
    document_number: string
    summary: string
    issuing_authority: string
    publishing_level: string
    issued_date: string
    effective_date: string
    status: string
}

const CATEGORIES = [
    'Tất cả', 'Công văn', 'Thông báo', 'Kế hoạch', 'Quyết định', 'Quy định',
    'Hướng dẫn', 'Tờ trình', 'Báo cáo', 'Thông tri', 'Chỉ thị',
    'Giấy xác nhận', 'Giấy mời', 'Hợp đồng', 'Quy chế', 'Biên bản', 'Đề án', 'Thông tư', 'Nghị định', 'Khác',
]

export default function VanBanClient({ documents }: { documents: DocItem[] }) {
    // Search states
    const [keyword, setKeyword] = useState('')
    const [searchField, setSearchField] = useState('all') // all | number | summary
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Advanced filters
    const [filterStatus, setFilterStatus] = useState('Tất cả')
    const [filterCategory, setFilterCategory] = useState('Tất cả')
    const [filterLevel, setFilterLevel] = useState('Tất cả')
    const [filterAuthority, setFilterAuthority] = useState('Tất cả')
    const [issuedFrom, setIssuedFrom] = useState('')
    const [issuedTo, setIssuedTo] = useState('')
    const [effectiveFrom, setEffectiveFrom] = useState('')
    const [effectiveTo, setEffectiveTo] = useState('')

    // Collect unique authorities
    const uniqueAuthorities = useMemo(() => {
        const set = new Set(documents.map(d => d.issuing_authority).filter(Boolean))
        return ['Tất cả', ...Array.from(set)]
    }, [documents])

    // Filter logic
    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            // Keyword search
            if (keyword) {
                const kw = keyword.toLowerCase()
                if (searchField === 'number') {
                    if (!doc.document_number.toLowerCase().includes(kw)) return false
                } else if (searchField === 'summary') {
                    if (!doc.summary.toLowerCase().includes(kw) && !doc.title.toLowerCase().includes(kw)) return false
                } else {
                    const combined = `${doc.title} ${doc.document_number} ${doc.summary} ${doc.category} ${doc.issuing_authority}`.toLowerCase()
                    if (!combined.includes(kw)) return false
                }
            }

            // Status
            if (filterStatus !== 'Tất cả' && doc.status !== filterStatus) return false

            // Category
            if (filterCategory !== 'Tất cả' && doc.category !== filterCategory) return false

            // Level
            if (filterLevel !== 'Tất cả' && doc.publishing_level !== filterLevel) return false

            // Authority
            if (filterAuthority !== 'Tất cả' && doc.issuing_authority !== filterAuthority) return false

            // Date ranges
            if (issuedFrom && doc.issued_date && new Date(doc.issued_date) < new Date(issuedFrom)) return false
            if (issuedTo && doc.issued_date && new Date(doc.issued_date) > new Date(issuedTo)) return false
            if (effectiveFrom && doc.effective_date && new Date(doc.effective_date) < new Date(effectiveFrom)) return false
            if (effectiveTo && doc.effective_date && new Date(doc.effective_date) > new Date(effectiveTo)) return false

            return true
        })
    }, [documents, keyword, searchField, filterStatus, filterCategory, filterLevel, filterAuthority, issuedFrom, issuedTo, effectiveFrom, effectiveTo])

    const formatDate = (d: string) => {
        if (!d) return '—'
        const dt = new Date(d)
        return isNaN(dt.getTime()) ? '—' : `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`
    }

    const resetFilters = () => {
        setFilterStatus('Tất cả'); setFilterCategory('Tất cả'); setFilterLevel('Tất cả'); setFilterAuthority('Tất cả')
        setIssuedFrom(''); setIssuedTo(''); setEffectiveFrom(''); setEffectiveTo('')
    }

    // Quick lookup categories
    const quickLookup = useMemo(() => {
        const counts: Record<string, number> = {}
        documents.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1 })
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
    }, [documents])

    return (
        <>
            {/* Hero */}
            <div className="bg-police-dark text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-police-dark via-police-dark/95 to-police-light/20"></div>
                <div className="absolute right-0 top-0 w-1/2 h-full opacity-5">
                    <div className="w-full h-full" style={{ backgroundImage: 'url(/logo.png)', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '250px' }}></div>
                </div>
                <div className="container mx-auto px-4 py-8 relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                            <FileText className="w-6 h-6 text-police-accent" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight">Hệ thống Văn bản & Quy định</h1>
                            <p className="text-blue-200/60 text-xs mt-0.5">Tuyển sinh CAND — Công an tỉnh Cao Bằng</p>
                        </div>
                    </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-police-accent via-yellow-400 to-police-accent/0"></div>
            </div>

            {/* Search Section */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    {!showAdvanced ? (
                        /* Simple Search */
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex gap-2 items-center">
                                {[{ v: 'all', l: 'Tất cả' }, { v: 'number', l: 'Số ký hiệu' }, { v: 'summary', l: 'Trích yếu' }].map(opt => (
                                    <label key={opt.v} className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="radio" name="searchField" value={opt.v} checked={searchField === opt.v} onChange={() => setSearchField(opt.v)}
                                            className="w-4 h-4 text-police-dark accent-police-dark" />
                                        <span className="text-sm text-slate-700 font-medium">{opt.l}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex flex-1 gap-2">
                                <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Nhập từ khóa tìm kiếm..." onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-police-light/30 focus:border-police-light transition" />
                                <button className="px-5 py-2.5 bg-police-dark hover:bg-police-light text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm">
                                    <Search className="w-4 h-4" /> Tìm kiếm
                                </button>
                                <button onClick={() => setShowAdvanced(true)} className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:border-police-light hover:text-police-dark text-sm font-semibold rounded-xl transition flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-4 h-4" /> Tìm kiếm nâng cao
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Advanced Search */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4 text-police-dark" /> Tìm kiếm nâng cao
                                </h3>
                                <button onClick={() => setShowAdvanced(false)} className="text-sm text-slate-500 hover:text-police-dark flex items-center gap-1 font-medium">
                                    <ArrowLeft className="w-4 h-4" /> Quay lại
                                </button>
                            </div>

                            {/* Keyword */}
                            <div className="flex gap-2">
                                <div className="flex gap-2 items-center shrink-0">
                                    {[{ v: 'all', l: 'Tất cả' }, { v: 'number', l: 'Số ký hiệu' }, { v: 'summary', l: 'Trích yếu' }].map(opt => (
                                        <label key={opt.v} className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="radio" name="searchField2" value={opt.v} checked={searchField === opt.v} onChange={() => setSearchField(opt.v)} className="w-3.5 h-3.5 accent-police-dark" />
                                            <span className="text-xs text-slate-600 font-medium">{opt.l}</span>
                                        </label>
                                    ))}
                                </div>
                                <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Nhập từ khóa..."
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-police-light/30 focus:border-police-light transition" />
                            </div>

                            {/* Filter Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Tình trạng hiệu lực</label>
                                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-police-light/30">
                                        <option>Tất cả</option><option>Còn hiệu lực</option><option>Chưa có hiệu lực</option><option>Hết hiệu lực</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Loại văn bản</label>
                                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-police-light/30">
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Cấp ban hành</label>
                                    <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-police-light/30">
                                        <option>Tất cả</option><option>Trung ương</option><option>Địa phương</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Cơ quan ban hành</label>
                                    <select value={filterAuthority} onChange={e => setFilterAuthority(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-police-light/30">
                                        {uniqueAuthorities.map(a => <option key={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Ban hành từ</label>
                                    <input type="date" value={issuedFrom} onChange={e => setIssuedFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-police-light/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Ban hành đến</label>
                                    <input type="date" value={issuedTo} onChange={e => setIssuedTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-police-light/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Hiệu lực từ</label>
                                    <input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-police-light/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Hiệu lực đến</label>
                                    <input type="date" value={effectiveTo} onChange={e => setEffectiveTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-police-light/30" />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={resetFilters} className="px-4 py-2 border border-slate-200 text-slate-500 text-sm font-semibold rounded-lg hover:bg-slate-50 transition flex items-center gap-1">
                                    <X className="w-3.5 h-3.5" /> Xóa bộ lọc
                                </button>
                                <button className="px-5 py-2 bg-police-dark hover:bg-police-light text-white text-sm font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm">
                                    <Search className="w-4 h-4" /> Tìm kiếm
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Left: Results */}
                    <div className="flex-1 min-w-0">
                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                Kết quả tra cứu
                                <span className="ml-2 text-police-dark">Có {filteredDocs.length} kết quả</span>
                            </h2>
                        </div>

                        {/* Document Cards */}
                        <div className="space-y-4">
                            {filteredDocs.length > 0 ? filteredDocs.map((doc, i) => (
                                <div key={doc.id} className="bg-white rounded-xl border border-slate-200 hover:border-police-light/40 hover:shadow-lg transition-all duration-300 overflow-hidden group">
                                    <div className="flex">
                                        {/* Number */}
                                        <div className="w-14 md:w-16 bg-police-dark/5 flex flex-col items-center justify-center shrink-0 border-r border-slate-100 py-4">
                                            <span className="text-xl md:text-2xl font-extrabold text-police-dark/25">{i + 1}</span>
                                        </div>

                                        <div className="flex-1 p-4 md:p-5">
                                            {/* Document Code */}
                                            {doc.document_number && (
                                                <p className="text-sm font-bold text-police-dark mb-1">{doc.document_number}</p>
                                            )}

                                            {/* Title / Summary */}
                                            <h3 className="text-base font-bold text-slate-800 group-hover:text-police-light transition-colors leading-snug mb-2">
                                                {doc.summary || doc.title}
                                            </h3>

                                            {/* Metadata */}
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                                                {doc.issuing_authority && (
                                                    <span>Cơ quan ban hành: <strong className="text-slate-700">{doc.issuing_authority}</strong></span>
                                                )}
                                                {doc.issued_date && (
                                                    <span>Ngày ban hành: <strong className="text-slate-700">{formatDate(doc.issued_date)}</strong></span>
                                                )}
                                                {doc.effective_date && (
                                                    <span>Ngày hiệu lực: <strong className="text-slate-700">{formatDate(doc.effective_date)}</strong></span>
                                                )}
                                            </div>

                                            {/* Status + Category badges */}
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <span className="bg-police-dark text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{doc.category}</span>
                                                {doc.status && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${doc.status === 'Còn hiệu lực' ? 'bg-green-100 text-green-700' :
                                                        doc.status === 'Hết hiệu lực' ? 'bg-red-100 text-red-600' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>{doc.status}</span>
                                                )}
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${doc.fileType === 'pdf' ? 'bg-red-50 text-red-600' :
                                                    doc.fileType === 'docx' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                                                    }`}>{doc.fileType || 'file'}</span>
                                            </div>

                                            {/* Action Tabs */}
                                            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                                                <Link href={`/van-ban/${doc.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-police-dark hover:bg-police-light text-white text-xs font-semibold rounded-lg transition">
                                                    <Eye className="w-3.5 h-3.5" /> Xem toàn văn
                                                </Link>
                                                <Link href={`/van-ban/${doc.id}?tab=attributes`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-police-light text-slate-600 text-xs font-semibold rounded-lg transition">
                                                    📋 Thuộc tính
                                                </Link>
                                                <Link href={`/van-ban/${doc.id}?tab=file`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-police-light text-slate-600 text-xs font-semibold rounded-lg transition">
                                                    <Download className="w-3.5 h-3.5" /> File đính kèm
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                                    <FileText className="w-14 h-14 mx-auto mb-3 text-slate-200" />
                                    <h3 className="text-lg font-bold text-slate-600 mb-1">Không tìm thấy văn bản</h3>
                                    <p className="text-sm text-slate-400">Hãy thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar: Quick Lookup */}
                    <aside className="hidden lg:block w-72 shrink-0">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm sticky top-20">
                            <div className="bg-police-dark text-white px-4 py-3 rounded-t-xl">
                                <h3 className="text-sm font-bold uppercase tracking-wide">Tra cứu nhanh</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {quickLookup.map(([cat, count]) => (
                                    <button
                                        key={cat}
                                        onClick={() => { setFilterCategory(cat); setKeyword('') }}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-blue-50 transition text-left ${filterCategory === cat ? 'bg-blue-50 text-police-dark font-bold' : 'text-slate-600'}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <ChevronRight className="w-3.5 h-3.5 text-police-light" />
                                            {cat}
                                        </span>
                                        <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
                                    </button>
                                ))}
                                {filterCategory !== 'Tất cả' && (
                                    <button
                                        onClick={() => setFilterCategory('Tất cả')}
                                        className="w-full px-4 py-3 text-sm text-police-light hover:bg-blue-50 transition text-left font-semibold"
                                    >
                                        ← Xem tất cả văn bản
                                    </button>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-police-dark text-white/60 py-6 mt-8">
                <div className="container mx-auto px-4 text-center text-xs">
                    <p>© 2026 Phòng Tổ chức cán bộ — Công an tỉnh Cao Bằng</p>
                    <p className="mt-1 text-white/30">Hệ thống quản lý văn bản tuyển sinh</p>
                </div>
            </footer>
        </>
    )
}
