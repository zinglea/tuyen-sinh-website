'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Trash2, X, GraduationCap, MapPin, Globe, Edit, Search, ShieldCheck } from 'lucide-react'

interface SchoolItem {
    id: string
    name: string
    code: string
    address: string
    region: string
    type: string
    description: string
    major_groups: string
    subjects: string
    website: string
    height_requirement: string
    weight_requirement: string
}

export default function AdminSchools() {
    const supabase = createClient()
    const [schools, setSchools] = useState<SchoolItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form fields
    const [id, setId] = useState('')
    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [address, setAddress] = useState('')
    const [region, setRegion] = useState('National')
    const [type, setType] = useState('Academy')
    const [description, setDescription] = useState('')
    const [majorGroups, setMajorGroups] = useState('')
    const [subjects, setSubjects] = useState('')
    const [website, setWebsite] = useState('')
    const [heightRequirement, setHeightRequirement] = useState('')
    const [weightRequirement, setWeightRequirement] = useState('')

    const fetchSchools = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('schools').select('*').order('name', { ascending: true })
        if (data) {
            setSchools(data as SchoolItem[])
        } else if (error && error.code === '42P01') {
            console.error('Bảng schools chưa được tạo. Vui lòng chạy lệnh SQL.')
        } else if (error) {
            console.error(error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchSchools()
    }, [])

    const resetForm = () => {
        setId(''); setName(''); setCode(''); setAddress(''); setRegion('National'); setType('Academy')
        setDescription(''); setMajorGroups(''); setSubjects(''); setWebsite('')
        setHeightRequirement(''); setWeightRequirement('')
        setEditingId(null)
    }

    const handleEdit = (item: SchoolItem) => {
        setEditingId(item.id)
        setId(item.id); setName(item.name || ''); setCode(item.code || '')
        setAddress(item.address || ''); setRegion(item.region || 'National'); setType(item.type || 'Academy')
        setDescription(item.description || ''); setMajorGroups(item.major_groups || '')
        setSubjects(item.subjects || ''); setWebsite(item.website || '')
        setHeightRequirement(item.height_requirement || ''); setWeightRequirement(item.weight_requirement || '')
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!id || !name) { alert('Mã ID và Tên trường là bắt buộc.'); return }
        setSubmitting(true)

        const payload = {
            id, name, code, address, region, type, description,
            major_groups: majorGroups, subjects, website,
            height_requirement: heightRequirement, weight_requirement: weightRequirement
        }

        let dbError = null
        if (editingId) {
            const { error } = await supabase.from('schools').update(payload).eq('id', editingId)
            dbError = error
        } else {
            const { error } = await supabase.from('schools').insert(payload)
            dbError = error
        }

        if (dbError) {
            if (dbError.code === '42P01') alert('Lỗi: Bảng "schools" chưa được tạo trên Supabase.')
            else alert('Lỗi: ' + dbError.message)
        } else {
            setShowModal(false); resetForm(); fetchSchools()
        }
        setSubmitting(false)
    }

    const handleDelete = async (item: SchoolItem) => {
        if (!confirm(`Bạn có chắc muốn xóa trường ${item.name} không?`)) return
        const { error } = await supabase.from('schools').delete().eq('id', item.id)
        if (error) alert('Lỗi: ' + error.message)
        else fetchSchools()
    }

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Danh bạ Trường CAND</h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý danh sách, khối thi, chỉ tiêu các trường khối Công an</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Tìm trường / mã trường..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-police-accent/30 focus:border-police-accent transition" />
                    </div>
                    <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-2 px-5 py-2.5 bg-police-dark hover:bg-police-dark/90 text-white font-semibold rounded-xl shadow-lg shadow-police-dark/20 transition-all shrink-0">
                        <Plus className="w-5 h-5" /> Thêm trường
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-police-accent border-t-transparent rounded-full animate-spin"></div></div>
            ) : schools.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500">
                    <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>Chưa có trường nào hoặc bảng dữ liệu chưa được tạo.<br />Vui lòng chạy SQL nếu cần.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredSchools.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-police-50 text-police-dark rounded-xl flex items-center justify-center font-bold text-lg shadow-inner">
                                        {item.code || item.id}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 line-clamp-2" title={item.name}>{item.name}</h3>
                                        <span className="text-xs font-semibold text-police-accent bg-police-50 px-2 py-0.5 rounded-md inline-block mt-1">{item.type}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(item)} className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Sửa"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(item)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-600 mb-4">
                                <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" /> <span className="line-clamp-1">{item.address || 'Đang cập nhật'}</span></p>
                                <p className="flex items-start gap-2"><GraduationCap className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" /> <span className="line-clamp-1 font-medium text-slate-700">{item.subjects || 'N/A'}</span></p>
                                {item.website && <p className="flex items-center gap-2"><Globe className="w-4 h-4 shrink-0 text-slate-400" /> <a href={item.website} target="_blank" className="text-blue-500 hover:underline line-clamp-1">{item.website}</a></p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Use */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Sửa thông tin Trường' : 'Thêm Trường mới'}</h2>
                            <button onClick={() => { setShowModal(false); resetForm() }} className="p-1 hover:bg-slate-200 rounded-lg transition"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <div className="overflow-y-auto p-6 flex-1">
                            <form id="schoolForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-700 border-b pb-2">Thông tin Cơ bản</h3>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mã ID (VD: ANH, CSH) *</label>
                                        <input type="text" value={id} onChange={e => setId(e.target.value)} required disabled={!!editingId} className="w-full px-4 py-2.5 bg-white border border-slate-200 justify-between rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-bold uppercase transition disabled:bg-slate-100 disabled:text-slate-400" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ký hiệu Trường (VD: T01) *</label>
                                        <input type="text" value={code} onChange={e => setCode(e.target.value)} required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 uppercase font-bold transition" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên Đầy đủ *</label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition" placeholder="Học viện An ninh nhân dân..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Khu vực</label>
                                            <select value={region} onChange={e => setRegion(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition">
                                                <option value="National">Toàn quốc (National)</option>
                                                <option value="North">Miền Bắc (North)</option>
                                                <option value="South">Miền Nam (South)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại hình</label>
                                            <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition">
                                                <option value="Academy">Học viện</option>
                                                <option value="University">Đại học</option>
                                                <option value="College">Cao đẳng</option>
                                                <option value="High School">Trung cấp / THPT</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ</label>
                                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Website liên kết</label>
                                        <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-blue-600 transition" placeholder="https://..." />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-700 border-b pb-2">Tuyển sinh & Đào tạo</h3>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngành / Chuyên ngành đào tạo</label>
                                        <input type="text" value={majorGroups} onChange={e => setMajorGroups(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition" placeholder="Nghiệp vụ An ninh, An ninh mạng... (Nhiều ngành cách nhau dấu phẩy)" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Khối xét tuyển</label>
                                        <input type="text" value={subjects} onChange={e => setSubjects(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition font-bold" placeholder="A00, A01, C03, D01, CA1..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quy định Chiều cao (tuỳ biến thêm)</label>
                                        <input type="text" value={heightRequirement} onChange={e => setHeightRequirement(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition" placeholder="Nam từ 1m64... (nếu để trống sẽ theo quy định chung)" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quy định Cân nặng (tuỳ biến thêm)</label>
                                        <input type="text" value={weightRequirement} onChange={e => setWeightRequirement(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition" placeholder="BMI 18.5 - 30..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giới thiệu ngắn</label>
                                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition h-24 resize-none" placeholder="Mô tả tóm tắt về trường..."></textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                            <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition text-sm">Hủy</button>
                            <button type="submit" form="schoolForm" disabled={submitting} className="flex-1 py-2.5 bg-police-dark hover:bg-police-dark/90 text-white font-semibold rounded-xl shadow-lg shadow-police-dark/20 transition disabled:opacity-50 text-sm">
                                {submitting ? 'Đang cập nhật...' : (editingId ? 'Cập nhật' : 'Thêm Trường')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
