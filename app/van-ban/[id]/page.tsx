'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import PdfViewerClient from '@/components/PdfViewerClient'
import Header from '@/components/Header'
import { ArrowLeft, Calendar, FileText, Download, Building2, Scale, Tag } from 'lucide-react'

interface DocDetail {
    id: string
    title: string
    file_url: string
    file_type: string | null
    category: string | null
    created_at: string
    document_number?: string
    summary?: string
    issuing_authority?: string
    publishing_level?: string
    issued_date?: string
    effective_date?: string
    status?: string
}

export default function VanBanDetailPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const docId = params.id as string
    const tabParam = searchParams.get('tab')

    const [doc, setDoc] = useState<DocDetail | null>(null)
    const [localDoc, setLocalDoc] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'fulltext' | 'attributes' | 'file'>(
        tabParam === 'attributes' ? 'attributes' : tabParam === 'file' ? 'file' : 'fulltext'
    )

    const isLocal = docId.startsWith('local-')
    const isCloud = docId.startsWith('cloud-')

    useEffect(() => {
        async function fetchDoc() {
            setLoading(true)

            if (isCloud) {
                const realId = docId.replace('cloud-', '')
                const supabase = createClient()
                const { data, error } = await supabase.from('documents').select('*').eq('id', realId).single()
                if (!error && data) setDoc(data as DocDetail)
            } else if (isLocal) {
                const localId = docId.replace('local-', '')
                try {
                    const res = await fetch('/api/local-news')
                    if (res.ok) {
                        const data = await res.json()
                        const found = (data.news || []).find((n: any) => n.id === localId)
                        if (found) {
                            setLocalDoc(found)
                            setDoc({
                                id: found.id,
                                title: found.title,
                                file_url: '',
                                file_type: 'pdf',
                                category: found.category,
                                created_at: found.date,
                                issuing_authority: found.author || '',
                                summary: found.excerpt || '',
                                status: 'Còn hiệu lực',
                            })
                        }
                    }
                } catch (e) { /* ignore */ }
            }

            setLoading(false)
        }
        fetchDoc()
    }, [docId])

    const formatDate = (d?: string) => {
        if (!d) return '—'
        const dt = new Date(d)
        return isNaN(dt.getTime()) ? '—' : `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`
    }

    // Determine the PDF viewer URL
    const getPdfUrl = () => {
        if (isCloud && doc) {
            // Use the proxy API so PdfViewerClient can fetch as blob
            return `/api/view-pdf?url=${encodeURIComponent(doc.file_url)}`
        }
        if (isLocal && localDoc) {
            // Use existing local PDF API
            const slug = localDoc.slug
            const rawFileUrl = localDoc.rawFileUrl || ''
            const fileName = rawFileUrl.split('/').pop() || `${slug}.pdf`
            return `/api/pdf?file=${encodeURIComponent(fileName)}`
        }
        return ''
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="w-12 h-12 border-4 border-police-light border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Đang tải văn bản...</p>
                </div>
            </div>
        )
    }

    if (!doc) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="container mx-auto px-4 py-20 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h2 className="text-xl font-bold text-slate-700 mb-2">Không tìm thấy văn bản</h2>
                    <Link href="/van-ban" className="text-police-light font-semibold hover:underline">← Quay lại danh sách</Link>
                </div>
            </div>
        )
    }

    const tabs = [
        { key: 'fulltext', label: 'Xem toàn văn', icon: '📄' },
        { key: 'attributes', label: 'Thuộc tính', icon: '📋' },
        { key: 'file', label: 'File đính kèm', icon: '📎' },
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            {/* Document Header */}
            <div className="bg-police-dark text-white">
                <div className="container mx-auto px-4 py-6">
                    <Link href="/van-ban" className="inline-flex items-center gap-1.5 text-blue-200/70 hover:text-white text-sm mb-3 transition">
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách văn bản
                    </Link>

                    {/* Document Number */}
                    {doc.document_number && (
                        <p className="text-police-accent font-bold text-sm mb-1">{doc.document_number}</p>
                    )}

                    {/* Title */}
                    <h1 className="text-lg md:text-xl font-extrabold leading-snug mb-3">
                        {doc.summary || doc.title}
                    </h1>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-blue-100/70">
                        {doc.issuing_authority && (
                            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {doc.issuing_authority}</span>
                        )}
                        {doc.issued_date && (
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Ban hành: {formatDate(doc.issued_date)}</span>
                        )}
                        {doc.effective_date && (
                            <span className="flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> Hiệu lực: {formatDate(doc.effective_date)}</span>
                        )}
                        {doc.status && (
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${doc.status === 'Còn hiệu lực' ? 'bg-green-500/20 text-green-200' :
                                doc.status === 'Hết hiệu lực' ? 'bg-red-500/20 text-red-200' :
                                    'bg-yellow-500/20 text-yellow-200'
                                }`}>{doc.status}</span>
                        )}
                    </div>
                </div>
                <div className="h-0.5 bg-gradient-to-r from-police-accent via-yellow-400 to-police-accent/0"></div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex gap-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${activeTab === tab.key
                                    ? 'border-police-dark text-police-dark'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="max-w-5xl mx-auto">

                    {/* Tab: Full Text */}
                    {activeTab === 'fulltext' && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            {doc.file_type === 'pdf' || isLocal ? (
                                <PdfViewerClient fileUrl={getPdfUrl()} />
                            ) : (
                                <div className="p-12 text-center">
                                    <FileText className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                                    <h3 className="text-lg font-bold text-slate-700 mb-2">Định dạng {doc.file_type?.toUpperCase()}</h3>
                                    <p className="text-slate-500 mb-4">File này không hỗ trợ xem trực tiếp trên trình duyệt. Hãy tải về để xem.</p>
                                    <a href={doc.file_url} download className="inline-flex items-center gap-2 px-6 py-3 bg-police-dark text-white font-bold rounded-xl shadow-lg hover:bg-police-light transition">
                                        <Download className="w-5 h-5" /> Tải xuống
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Attributes */}
                    {activeTab === 'attributes' && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-police-dark" /> Thuộc tính văn bản
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { label: 'Số ký hiệu', value: doc.document_number },
                                    { label: 'Loại văn bản', value: doc.category },
                                    { label: 'Tên văn bản', value: doc.title },
                                    { label: 'Cơ quan ban hành', value: doc.issuing_authority },
                                    { label: 'Cấp ban hành', value: doc.publishing_level },
                                    { label: 'Ngày ban hành', value: formatDate(doc.issued_date) },
                                    { label: 'Ngày hiệu lực', value: formatDate(doc.effective_date) },
                                    { label: 'Tình trạng', value: doc.status },
                                    { label: 'Ngày đăng', value: formatDate(doc.created_at) },
                                    { label: 'Định dạng file', value: doc.file_type?.toUpperCase() },
                                ].map((row, i) => (
                                    <div key={i} className="flex border-b border-slate-100 pb-3">
                                        <span className="w-40 shrink-0 text-sm font-semibold text-slate-500">{row.label}:</span>
                                        <span className="text-sm text-slate-800 font-medium">{row.value || '—'}</span>
                                    </div>
                                ))}
                            </div>
                            {doc.summary && (
                                <div className="mt-6">
                                    <span className="text-sm font-semibold text-slate-500">Trích yếu:</span>
                                    <p className="text-sm text-slate-800 mt-1 leading-relaxed">{doc.summary}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: File Attachment */}
                    {activeTab === 'file' && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
                            <h2 className="text-lg font-bold text-slate-800 mb-6">File đính kèm</h2>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${doc.file_type === 'pdf' ? 'bg-red-500' :
                                    doc.file_type === 'docx' ? 'bg-blue-500' :
                                        doc.file_type === 'xlsx' ? 'bg-emerald-500' :
                                            doc.file_type === 'pptx' ? 'bg-orange-500' : 'bg-slate-400'
                                    }`}>
                                    <span className="text-white text-sm font-extrabold uppercase">{doc.file_type || '?'}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 text-sm">{doc.title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{doc.file_type?.toUpperCase()} · Đăng ngày {formatDate(doc.created_at)}</p>
                                </div>
                                {isCloud && (
                                    <a href={doc.file_url} download className="inline-flex items-center gap-2 px-5 py-2.5 bg-police-dark hover:bg-police-light text-white text-sm font-semibold rounded-xl transition shadow-sm">
                                        <Download className="w-4 h-4" /> Tải xuống
                                    </a>
                                )}
                                {isLocal && localDoc && (
                                    <Link href={`/tin-tuc/${localDoc.slug}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-police-dark hover:bg-police-light text-white text-sm font-semibold rounded-xl transition shadow-sm">
                                        <FileText className="w-4 h-4" /> Xem trên site
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
