'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Trash2, X, Newspaper, Calendar, User, Cloud, Server, Eye, Upload as UploadIcon, FileUp, Edit3, Image as ImageIcon } from 'lucide-react'
import RichEditor from '@/components/RichEditor'

interface NewsItem {
    id: string
    title: string
    content: string | null
    image_url: string | null
    author: string
    created_at: string
    source: 'supabase' | 'local'
    slug?: string
    category?: string
}

const CATEGORIES = [
    'Tin Tức', 'Thông báo', 'Hướng dẫn', 'Tuyển sinh', 'Đào tạo',
    'Hoạt động', 'Sự kiện', 'Trình bày', 'Khác',
]

export default function AdminNewsPage() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [viewItem, setViewItem] = useState<NewsItem | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [migrating, setMigrating] = useState<string | null>(null)
    const [progress, setProgress] = useState('')
    const [showPreview, setShowPreview] = useState(false)

    // Mode: 'write' = soạn thảo, 'upload' = upload file
    const [mode, setMode] = useState<'write' | 'upload'>('upload')

    // Form fields
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [author, setAuthor] = useState('Admin')
    const [category, setCategory] = useState('Tin Tức')
    const [articleDate, setArticleDate] = useState('')

    // File upload
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [parsedHtml, setParsedHtml] = useState('')
    const [parsing, setParsing] = useState(false)

    // Thumbnail
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
    const [thumbnailPreview, setThumbnailPreview] = useState('')
    const thumbnailRef = useRef<HTMLInputElement>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const supabase = createClient()

    const fetchAll = async () => {
        setLoading(true)
        const { data: sbData } = await supabase.from('news').select('*').order('created_at', { ascending: false })
        const supabaseItems: NewsItem[] = (sbData || []).map((item: any) => ({ ...item, source: 'supabase' as const, category: item.category || 'Tin tức' }))

        let localItems: NewsItem[] = []
        try {
            const res = await fetch('/api/local-news')
            if (res.ok) {
                const data = await res.json()
                localItems = (data.news || [])
                    .filter((item: any) => item.contentType !== 'raw_document')
                    .map((item: any) => ({
                        id: item.id, title: item.title, content: item.excerpt || '',
                        image_url: item.image || null, author: item.author || 'Admin',
                        created_at: item.date, source: 'local' as const, slug: item.slug,
                        category: item.category,
                    }))
            }
        } catch (e) { /* ignore */ }

        setNews([...supabaseItems, ...localItems])
        setLoading(false)
    }

    useEffect(() => { fetchAll() }, [])

    const resetForm = () => {
        setTitle(''); setContent(''); setAuthor('Admin'); setCategory('Tin Tức'); setArticleDate('')
        setSelectedFile(null); setParsedHtml(''); setThumbnailFile(null); setThumbnailPreview('')
        if (fileRef.current) fileRef.current.value = ''
        if (thumbnailRef.current) thumbnailRef.current.value = ''
    }

    // Handle file selection → auto parse
    const handleFileSelect = async (file: File) => {
        setSelectedFile(file)
        setParsing(true)
        setProgress('Đang phân tích file...')

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/parse-upload', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.success) {
                setParsedHtml(data.html)
                setProgress(`✅ Đã phân tích xong! (${data.fileType.toUpperCase()})`)
                // Auto-fill title from filename if empty
                if (!title) {
                    const name = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
                    setTitle(name)
                }
            } else {
                setProgress('❌ Lỗi: ' + (data.error || 'Không thể phân tích file'))
            }
        } catch (e: any) {
            setProgress('❌ Lỗi kết nối: ' + e.message)
        }
        setParsing(false)
    }

    // Handle thumbnail
    const handleThumbnail = (file: File) => {
        setThumbnailFile(file)
        const reader = new FileReader()
        reader.onload = (e) => setThumbnailPreview(e.target?.result as string)
        reader.readAsDataURL(file)
    }

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) { alert('Nhập tiêu đề bài viết.'); return }
        setSubmitting(true)

        let imageUrl = ''

        // Upload thumbnail if provided
        if (thumbnailFile) {
            setProgress('Đang upload ảnh thumbnail...')
            const thumbName = `thumb_${Date.now()}_${thumbnailFile.name}`
            const { error: thumbErr } = await supabase.storage
                .from('tuyensinh_files').upload(thumbName, thumbnailFile, { cacheControl: '3600', upsert: false })
            if (!thumbErr) {
                const { data: urlData } = supabase.storage.from('tuyensinh_files').getPublicUrl(thumbName)
                imageUrl = urlData.publicUrl
            }
        }

        // Determine content
        let finalContent = ''
        if (mode === 'upload' && parsedHtml) {
            finalContent = parsedHtml
            // For PDF: also upload the file and store the URL
            if (selectedFile && parsedHtml === '__PDF_FILE__') {
                setProgress('Đang upload file PDF...')
                const pdfName = `news_${Date.now()}_${selectedFile.name}`
                const { error: pdfErr } = await supabase.storage
                    .from('tuyensinh_files').upload(pdfName, selectedFile, { cacheControl: '3600', upsert: false })
                if (!pdfErr) {
                    const { data: urlData } = supabase.storage.from('tuyensinh_files').getPublicUrl(pdfName)
                    finalContent = `__PDF_URL__${urlData.publicUrl}`
                }
            }
        } else {
            finalContent = content
        }

        setProgress('Đang lưu bài viết...')
        const { error } = await supabase.from('news').insert({
            title,
            content: finalContent,
            author,
            category,
            image_url: imageUrl || null,
        })

        if (!error) {
            setShowModal(false); resetForm(); fetchAll()
            setProgress('')
        } else {
            alert('Lỗi: ' + error.message)
        }
        setSubmitting(false)
    }

    const handleDelete = async (item: NewsItem) => {
        if (item.source === 'local') {
            alert('Bài viết local — hãy xóa file gốc trên máy chủ.'); return
        }
        if (!confirm('Xóa bài viết này?')) return
        const { error } = await supabase.from('news').delete().eq('id', item.id)
        if (!error) fetchAll()
        else alert('Lỗi: ' + error.message)
    }

    const handleMigrateToCloud = async (item: NewsItem) => {
        if (item.source !== 'local') return
        setMigrating(item.id)
        const { error } = await supabase.from('news').insert({ title: item.title, content: item.content, author: item.author, category: item.category || 'Tin tức' })
        if (!error) { alert('✅ Đã đẩy lên Cloud!'); fetchAll() }
        else alert('Lỗi: ' + error.message)
        setMigrating(null)
    }

    const supabaseCount = news.filter(n => n.source === 'supabase').length
    const localCount = news.filter(n => n.source === 'local').length

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Quản lý Tin tức</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        <span className="text-emerald-600 font-medium">{supabaseCount} Cloud</span>
                        {localCount > 0 && <> · <span className="text-amber-600 font-medium">{localCount} Local</span></>}
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all">
                    <Plus className="w-5 h-5" /> Thêm bài viết
                </button>
            </div>

            {/* News List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 animate-pulse">Đang tải...</div>
                ) : news.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Newspaper className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p>Chưa có bài viết.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {news.map((item) => (
                            <div key={`${item.source}-${item.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition">
                                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><Newspaper className="w-6 h-6 text-slate-300" /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-slate-800 text-sm truncate">{item.title}</h3>
                                        {item.source === 'supabase' ? (
                                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md"><Cloud className="w-3 h-3" /> Cloud</span>
                                        ) : (
                                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md"><Server className="w-3 h-3" /> Local</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span className="flex items-center gap-1 font-semibold text-slate-500">{item.category}</span>
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.author}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {item.source === 'local' && item.slug ? (
                                        <a href={`/tin-tuc/${item.slug}`} target="_blank" className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Xem"><Eye className="w-4 h-4" /></a>
                                    ) : item.source === 'supabase' ? (
                                        <button onClick={() => setViewItem(item)} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Xem"><Eye className="w-4 h-4" /></button>
                                    ) : null}
                                    {item.source === 'local' && (
                                        <button onClick={() => handleMigrateToCloud(item)} disabled={migrating === item.id} className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50" title="Đẩy lên Cloud"><UploadIcon className="w-4 h-4" /></button>
                                    )}
                                    <button onClick={() => handleDelete(item)} className={`p-2 rounded-lg transition ${item.source === 'supabase' ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-300 cursor-not-allowed'}`}><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
                            <h2 className="text-lg font-bold text-slate-800 truncate pr-4">{viewItem.title}</h2>
                            <button onClick={() => setViewItem(null)} className="p-1 hover:bg-slate-100 rounded-lg transition shrink-0"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-3 text-sm text-slate-500 mb-4">
                                <span className="flex items-center gap-1"><User className="w-4 h-4" />{viewItem.author}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(viewItem.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="prose prose-slate max-w-none text-sm" dangerouslySetInnerHTML={{ __html: viewItem.content || '<p>Không có nội dung.</p>' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                            <h2 className="text-lg font-bold text-slate-800">Thêm bài viết mới</h2>
                            <button onClick={() => { setShowModal(false); resetForm() }} className="p-1 hover:bg-slate-100 rounded-lg transition"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        {/* Mode Tabs */}
                        <div className="flex border-b border-slate-100 px-6 shrink-0">
                            <button onClick={() => setMode('upload')} className={`px-5 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${mode === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                                <FileUp className="w-4 h-4" /> Upload file (Word, PDF, PPTX...)
                            </button>
                            <button onClick={() => setMode('write')} className={`px-5 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${mode === 'write' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                                <Edit3 className="w-4 h-4" /> Soạn thảo trực tiếp
                            </button>
                        </div>

                        {/* Scrollable Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Row 1: Category + Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại văn bản / Chuyên mục *</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition">
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày văn bản</label>
                                    <input type="date" value={articleDate} onChange={e => setArticleDate(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition" />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tiêu đề bài viết *</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="VD: Thông báo tuyển sinh năm 2026" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition text-sm" />
                            </div>

                            {/* Author */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tác giả</label>
                                <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Admin" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition text-sm" />
                            </div>

                            {/* Thumbnail */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    <ImageIcon className="w-4 h-4 inline mr-1" /> Ảnh thumbnail (không bắt buộc)
                                </label>
                                <div className="flex items-center gap-4">
                                    <input ref={thumbnailRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => e.target.files?.[0] && handleThumbnail(e.target.files[0])} className="flex-1 text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                                    {thumbnailPreview && (
                                        <div className="w-20 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                            <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">💡 Ảnh lý tưởng: 1200×630px hoặc tỷ lệ 16:9. Dùng JPG/PNG.</p>
                            </div>

                            {/* Content Area - depends on mode */}
                            {mode === 'upload' ? (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Upload file nội dung *</label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition">
                                        <input ref={fileRef} type="file" accept=".doc,.docx,.pptx,.ppt,.pdf,.xlsx,.xls" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" id="file-upload" />
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <FileUp className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                            <p className="text-sm font-semibold text-slate-600 mb-1">
                                                {selectedFile ? `📎 ${selectedFile.name}` : 'Chọn file để upload'}
                                            </p>
                                            <p className="text-xs text-slate-400">Hỗ trợ: DOCX, PPTX, PDF, XLSX</p>
                                        </label>
                                    </div>
                                    {progress && (
                                        <div className={`mt-3 flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl ${progress.startsWith('❌') ? 'bg-red-50 text-red-600' : progress.startsWith('✅') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {!progress.startsWith('✅') && !progress.startsWith('❌') && <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>}
                                            {progress}
                                        </div>
                                    )}

                                    {/* Quy trình hướng dẫn */}
                                    <div className="mt-4 bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-2">
                                        <p className="font-bold text-slate-700 text-sm">📋 Quy trình đăng bài chuyên nghiệp:</p>
                                        <div className="space-y-1.5">
                                            <p>📄 <strong>Word (.docx):</strong> Soạn bài trong Word bình thường. Ảnh trong bài giữ nguyên tỷ lệ gốc (nên dùng ảnh ngang 16:9).</p>
                                            <p>🖼️ <strong>Chú thích ảnh:</strong> Viết <code className="bg-white px-1.5 py-0.5 rounded">##chú thích ảnh##</code> ngay bên dưới ảnh → hiển thị chữ nghiêng bên dưới.</p>
                                            <p>🎬 <strong>Chèn video:</strong> Viết <code className="bg-white px-1.5 py-0.5 rounded">##https://youtube.com/watch?v=xxx##</code> → video nhúng tự động.</p>
                                            <p>📊 <strong>PowerPoint (.pptx):</strong> Mỗi slide hiển thị thành 1 phần, có nút chuyển slide.</p>
                                            <p>📕 <strong>PDF:</strong> Hiển thị trình đọc PDF nhúng chuyên nghiệp.</p>
                                            <p>😊 <strong>Emoji:</strong> Hỗ trợ emoji đầy đủ trên web. Dùng emoji (✅❌📌🔴) thay cho icon Word (Symbol, Wingdings).</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nội dung bài viết</label>
                                    <p className="text-xs text-slate-400 mb-2">💡 Soạn trực tiếp như Word: dùng thanh công cụ để in đậm, nghiêng, tạo danh sách... Hoặc copy từ Word rồi dán vào.</p>
                                    <RichEditor value={content} onChange={setContent} placeholder="Soạn nội dung bài viết tại đây..." />
                                </div>
                            )}

                            {/* Preview Panel */}
                            {showPreview && (
                                <div className="border border-blue-200 rounded-xl overflow-hidden">
                                    <div className="bg-blue-50 px-4 py-2 flex items-center justify-between">
                                        <span className="text-sm font-bold text-blue-700">👁️ Xem trước bài viết</span>
                                        <button type="button" onClick={() => setShowPreview(false)} className="text-xs text-blue-500 hover:text-blue-700">Đóng</button>
                                    </div>
                                    <div className="p-6 bg-white max-h-[400px] overflow-y-auto">
                                        <h2 className="text-xl font-bold text-slate-800 mb-2">{title || 'Chưa có tiêu đề'}</h2>
                                        <div className="flex gap-3 text-xs text-slate-400 mb-4">
                                            <span>📁 {category}</span>
                                            <span>✍️ {author}</span>
                                            {articleDate && <span>📅 {new Date(articleDate).toLocaleDateString('vi-VN')}</span>}
                                        </div>
                                        {thumbnailPreview && <img src={thumbnailPreview} alt="Thumbnail" className="w-full max-h-48 object-cover rounded-xl mb-4" />}
                                        <div className="prose prose-slate prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: mode === 'upload' ? parsedHtml : content }} />
                                    </div>
                                </div>
                            )}

                            {/* Submit */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="py-2.5 px-5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition text-sm">Hủy</button>
                                <button type="button" onClick={() => setShowPreview(!showPreview)} disabled={mode === 'upload' ? !parsedHtml : !content} className="py-2.5 px-5 border border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition text-sm disabled:opacity-50">
                                    👁️ {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
                                </button>
                                <button type="submit" disabled={submitting || (mode === 'upload' && !parsedHtml)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition disabled:opacity-50 text-sm">
                                    {submitting ? 'Đang lưu...' : 'Đăng bài'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
