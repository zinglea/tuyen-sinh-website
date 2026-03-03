'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Header from '@/components/Header'
import { Search, MapPin, Globe, GraduationCap, Building2, Filter } from 'lucide-react'

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

export default function SchoolDirectoryPage() {
    const supabase = createClient()
    const [schools, setSchools] = useState<SchoolItem[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [regionFilter, setRegionFilter] = useState('All')
    const [subjectFilter, setSubjectFilter] = useState('All')

    useEffect(() => {
        const fetchSchools = async () => {
            setLoading(true)
            const { data, error } = await supabase.from('schools').select('*').order('name', { ascending: true })
            if (data) {
                setSchools(data as SchoolItem[])
            }
            // Ignore error gracefully on public view if table doesn't exist yet
            setLoading(false)
        }
        fetchSchools()
    }, [])

    const filteredSchools = schools.filter(school => {
        const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (school.code && school.code.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesRegion = regionFilter === 'All' || school.region === regionFilter
        const matchesSubject = subjectFilter === 'All' ||
            (school.subjects && school.subjects.toLowerCase().includes(subjectFilter.toLowerCase()))

        return matchesSearch && matchesRegion && matchesSubject
    })

    // Extract unique subjects for the filter dropdown
    const allSubjects = Array.from(new Set(
        schools.flatMap(s => s.subjects ? s.subjects.split(',').map(sub => sub.trim()) : [])
    )).filter(Boolean).sort()

    return (
        <div
            className="min-h-screen bg-transparent flex flex-col relative bg-cover bg-[center_10%] bg-fixed"
            style={{ backgroundImage: "url('/bg-don-vi.jpg')" }}
        >
            {/* Lớp phủ trắng 50% */}
            <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[2px] z-0"></div>

            <div className="relative z-10 flex flex-col flex-grow">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
                    <div className="text-center mb-10 bg-white/60 p-6 rounded-3xl shadow-sm border border-white/50 backdrop-blur-sm">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-police-dark mb-4 uppercase tracking-tight">
                            Danh sách các trường CAND
                        </h1>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Tra cứu thông tin tuyển sinh, khối thi và các quy định của các Học viện, Trường Đại học, Cao đẳng trong hệ thống Công an nhân dân.
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-8 max-w-5xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên trường, mã trường (VD: T01, ANH)..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-police-accent/30 focus:border-police-accent transition"
                                />
                            </div>
                            <div className="flex gap-4 w-full md:w-auto shrink-0">
                                <div className="flex-1 md:w-48">
                                    <select
                                        value={regionFilter}
                                        onChange={e => setRegionFilter(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-police-accent/30 focus:border-police-accent transition appearance-none cursor-pointer"
                                    >
                                        <option value="All">Khu vực: Tất cả</option>
                                        <option value="North">Miền Bắc</option>
                                        <option value="South">Miền Nam</option>
                                        <option value="National">Toàn quốc</option>
                                    </select>
                                </div>
                                <div className="flex-1 md:w-48">
                                    <select
                                        value={subjectFilter}
                                        onChange={e => setSubjectFilter(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-police-accent/30 focus:border-police-accent transition appearance-none cursor-pointer"
                                    >
                                        <option value="All">Khối thi: Tất cả</option>
                                        {allSubjects.map(sub => (
                                            <option key={sub} value={sub}>Tổ hợp {sub}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-police-accent border-t-transparent rounded-full animate-spin"></div></div>
                    ) : filteredSchools.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="inline-flex w-16 h-16 bg-slate-100 items-center justify-center rounded-2xl mb-4">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700">Không tìm thấy kết quả</h3>
                            <p className="text-slate-500 mt-2">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
                            {filteredSchools.map((school) => (
                                <div key={school.id} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                                    <div className="bg-gradient-to-r from-police-dark to-police-light p-6 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10"></div>
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div>
                                                <span className="inline-block px-3 py-1 bg-white/20 rounded-lg text-xs font-bold uppercase tracking-wider mb-3">
                                                    {school.code || school.id}
                                                </span>
                                                <h2 className="text-xl font-extrabold leading-tight">{school.name}</h2>
                                            </div>
                                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                                                <Building2 className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="space-y-4 mb-6 flex-1">
                                            <div className="flex items-start gap-3">
                                                <MapPin className="w-5 h-5 shrink-0 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs uppercase font-bold text-slate-400">Địa chỉ / Khu vực</p>
                                                    <p className="text-sm font-medium text-slate-700">{school.address || 'Đang cập nhật'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <GraduationCap className="w-5 h-5 shrink-0 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs uppercase font-bold text-slate-400">Khối xét tuyển / Ngành</p>
                                                    <p className="text-sm font-bold text-police-dark">{school.subjects || 'N/A'}</p>
                                                    <p className="text-sm text-slate-600 mt-1 line-clamp-2" title={school.major_groups}>{school.major_groups}</p>
                                                </div>
                                            </div>
                                            {school.description && (
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                    <p className="text-sm text-slate-600 italic line-clamp-3">"{school.description}"</p>
                                                </div>
                                            )}
                                            {((school.height_requirement) || (school.weight_requirement)) && (
                                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                    <p className="text-xs uppercase font-bold text-blue-800 mb-1">Quy định Sức khỏe bổ sung</p>
                                                    <ul className="text-sm text-blue-900 list-disc pl-4 space-y-1">
                                                        {school.height_requirement && <li><strong>Chiều cao:</strong> {school.height_requirement}</li>}
                                                        {school.weight_requirement && <li><strong>Cân nặng:</strong> {school.weight_requirement}</li>}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-4 border-t border-slate-100">
                                            {school.website ? (
                                                <a href={school.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-police-dark font-bold rounded-xl transition-colors">
                                                    <Globe className="w-4 h-4" /> Truy cập Website
                                                </a>
                                            ) : (
                                                <button disabled className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 text-slate-400 font-bold rounded-xl cursor-not-allowed">
                                                    <Globe className="w-4 h-4" /> Chưa cập nhật Website
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
