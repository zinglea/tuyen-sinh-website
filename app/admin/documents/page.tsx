'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, X, FileText, Upload, Calendar, Cloud, Server, Eye, Download, Edit } from 'lucide-react'

interface DocumentItem {
    id: string
    title: string
    file_url: string
    file_type: string | null
    category: string | null
    created_at: string
    source: 'supabase' | 'local'
    slug?: string
    document_number?: string
    summary?: string
    issuing_authority?: string
    publishing_level?: string
    issued_date?: string
    effective_date?: string
    status?: string
}

const FILE_COLORS: Record<string, string> = {
    pdf: 'bg-red-500', docx: 'bg-blue-500', doc: 'bg-blue-500',
    xlsx: 'bg-emerald-500', xls: 'bg-emerald-500',
    pptx: 'bg-orange-500', ppt: 'bg-orange-500',
}

const CATEGORIES = [
    'Công văn', 'Thông báo', 'Kế hoạch', 'Quyết định', 'Quy định',
    'Hướng dẫn', 'Tờ trình', 'Báo cáo', 'Thông tri', 'Chỉ thị',
    'Giấy xác nhận', 'Giấy mời', 'Hợp đồng', 'Quy chế', 'Biên bản', 'Đề án', 'Thông tư', 'Nghị định', 'Khác',
]

const STATUS_OPTIONS = ['Còn hiệu lực', 'Chưa có hiệu lực', 'Hết hiệu lực']
const LEVEL_OPTIONS = ['Trung ương', 'Địa phương']

export default function AdminDocumentsPage() {
    const [docs, setDocs] = useState<DocumentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [uploadProgress, setUploadProgress] = useState('')
    const fileRef = useRef<HTMLInputElement>(null)

    // Form fields
    const [documentNumber, setDocumentNumber] = useState('')
    const [title, setTitle] = useState('')
    const [summary, setSummary] = useState('')
    const [category, setCategory] = useState('Công văn')
    const [issuingAuthority, setIssuingAuthority] = useState('')
    const [publishingLevel, setPublishingLevel] = useState('Địa phương')
    const [issuedDate, setIssuedDate] = useState('')
    const [effectiveDate, setEffectiveDate] = useState('')
    const [docStatus, setDocStatus] = useState('Còn hiệu lực')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const supabase = createClient()

    const fetchAll = async () => {
        setLoading(true)
        const { data: sbData } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
        const supabaseItems: DocumentItem[] = (sbData || []).map((d: any) => ({ ...d, source: 'supabase' as const }))

        let localItems: DocumentItem[] = []
        try {
            const res = await fetch('/api/local-news')
            if (res.ok) {
                const data = await res.json()
                localItems = (data.news || [])
                    .filter((item: any) => item.contentType === 'raw_document')
                    .map((item: any) => ({
                        id: item.id, title: item.title, file_url: `/tin-tuc/${item.slug}`,
                        file_type: 'pdf', category: item.category, created_at: item.date,
                        source: 'local' as const, slug: item.slug,
                    }))
            }
        } catch (e) { /* ignore */ }

        setDocs([...supabaseItems, ...localItems])
        setLoading(false)
    }

    useEffect(() => { fetchAll() }, [])

    const resetForm = () => {
        setDocumentNumber(''); setTitle(''); setSummary(''); setCategory('Công văn')
        setIssuingAuthority(''); setPublishingLevel('Địa phương')
        setIssuedDate(''); setEffectiveDate(''); setDocStatus('Còn hiệu lực')
        setSelectedFile(null); if (fileRef.current) fileRef.current.value = ''
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedFile) { alert('Chọn file để upload.'); return }
        setSubmitting(true)
        setUploadProgress('Đang upload file...')

        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || ''
        const fileName = `${Date.now()}_${selectedFile.name}`

        const { error: uploadError } = await supabase.storage
            .from('tuyensinh_files').upload(fileName, selectedFile, { cacheControl: '3600', upsert: false })

        if (uploadError) {
            alert('Lỗi upload: ' + uploadError.message); setSubmitting(false); setUploadProgress(''); return
        }

        const { data: urlData } = supabase.storage.from('tuyensinh_files').getPublicUrl(fileName)
        setUploadProgress('Đang lưu vào Database...')

        const { error: dbError } = await supabase.from('documents').insert({
            title,
            file_url: urlData.publicUrl,
            file_type: fileExt,
            category,
            document_number: documentNumber || null,
            summary: summary || null,
            issuing_authority: issuingAuthority || null,
            publishing_level: publishingLevel || null,
            issued_date: issuedDate || null,
            effective_date: effectiveDate || null,
            status: docStatus || null,
        })

        if (dbError) alert('Lỗi DB: ' + dbError.message)
        else { setShowModal(false); resetForm(); fetchAll() }
        setSubmitting(false); setUploadProgress('')
    }

    const handleDelete = async (doc: DocumentItem) => {
        if (doc.source === 'local') {
            alert('Văn bản local — hãy xóa file gốc trên máy chủ.'); return
        }
        if (!confirm(`Xóa "${doc.title}"?`)) return
        const urlParts = doc.file_url.split('/')
        await supabase.storage.from('tuyensinh_files').remove([urlParts[urlParts.length - 1]])
        const { error } = await supabase.from('documents').delete().eq('id', doc.id)
        if (!error) fetchAll()
        else alert('Lỗi: ' + error.message)
    }

    const supabaseCount = docs.filter(d => d.source === 'supabase').length
    const localCount = docs.filter(d => d.source === 'local').length

    return (
        <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Quản lý Văn bản</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        <span className="text-emerald-600 font-medium">{supabaseCount} Cloud</span>
                        {localCount > 0 && <> · <span className="text-amber-600 font-medium">{localCount} Local</span></>}
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                    <Upload className="w-5 h-5" /> Upload văn bản
                </button>
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 animate-pulse">Đang tải...</div>
                ) : docs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p>Chưa có văn bản.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {docs.map((doc) => (
                            <div key={`${doc.source}-${doc.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition">
                                <div className={`w-12 h-12 rounded-xl ${FILE_COLORS[doc.file_type || ''] || 'bg-slate-400'} flex items-center justify-center shrink-0 shadow-sm`}>
                                    <span className="text-white text-xs font-extrabold uppercase">{doc.file_type || '?'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {doc.document_number && (
                                            <span className="text-xs font-bold text-police-dark bg-blue-50 px-2 py-0.5 rounded">{doc.document_number}</span>
                                        )}
                                        <h3 className="font-semibold text-slate-800 text-sm truncate">{doc.title}</h3>
                                        {doc.source === 'supabase' ? (
                                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md"><Cloud className="w-3 h-3" /> Cloud</span>
                                        ) : (
                                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md"><Server className="w-3 h-3" /> Local</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{doc.category || 'Khác'}</span>
                                        {doc.issuing_authority && <span>CQ: <span className="text-slate-600">{doc.issuing_authority}</span></span>}
                                        {doc.status && (
                                            <span className={`px-2 py-0.5 rounded font-medium ${doc.status === 'Còn hiệu lực' ? 'bg-green-50 text-green-700' : doc.status === 'Hết hiệu lực' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                                                {doc.status}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => window.open(doc.source === 'local' && doc.slug ? `/tin-tuc/${doc.slug}` : doc.file_url, '_blank')} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Xem"><Eye className="w-4 h-4" /></button>
                                    {doc.source === 'supabase' && <a href={doc.file_url} download className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition" title="Tải"><Download className="w-4 h-4" /></a>}
                                    <button onClick={() => handleDelete(doc)} className={`p-2 rounded-lg transition ${doc.source === 'supabase' ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-300 cursor-not-allowed'}`}><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal - Expanded */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
                            <h2 className="text-lg font-bold text-slate-800">Upload văn bản mới</h2>
                            <button onClick={() => { setShowModal(false); resetForm() }} className="p-1 hover:bg-slate-100 rounded-lg transition"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Row 1: Số ký hiệu + Loại */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số ký hiệu *</label>
                                    <input type="text" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} required placeholder="VD: 20/2026/TT-BCA" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại văn bản *</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition">
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Tên văn bản */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên văn bản *</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="VD: Thông tư 20/2026/TT-BCA" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-sm" />
                            </div>

                            {/* Trích yếu */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trích yếu</label>
                                <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} placeholder="Mô tả ngắn gọn nội dung văn bản..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-sm resize-none" />
                            </div>

                            {/* Row: CQ ban hành + Cấp ban hành */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cơ quan ban hành</label>
                                    <input type="text" value={issuingAuthority} onChange={e => setIssuingAuthority(e.target.value)} placeholder="VD: Bộ Công an" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cấp ban hành</label>
                                    <select value={publishingLevel} onChange={e => setPublishingLevel(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition">
                                        {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Row: Ngày ban hành + Ngày hiệu lực + Tình trạng */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày ban hành</label>
                                    <input type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày hiệu lực</label>
                                    <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tình trạng</label>
                                    <select value={docStatus} onChange={e => setDocStatus(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition">
                                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* File */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chọn file đính kèm *</label>
                                <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt" onChange={e => setSelectedFile(e.target.files?.[0] || null)} required className="w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                                {selectedFile && <p className="text-xs text-slate-400 mt-1.5">📎 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
                            </div>

                            {uploadProgress && (
                                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl">
                                    <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>{uploadProgress}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition text-sm">Hủy</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 text-sm">
                                    {submitting ? 'Đang upload...' : 'Upload & Lưu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
