import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

export default function GioiThieuPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Header />

            <div className="bg-police-dark text-white py-12 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-police-light/20 to-transparent skew-x-12 transform translate-x-10"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight drop-shadow-lg mb-2">
                        Giới thiệu chung
                    </h1>
                    <p className="text-blue-100 max-w-2xl mx-auto">
                        Cổng thông tin Tuyển sinh Công an nhân dân tỉnh Cao Bằng
                    </p>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 prose prose-slate max-w-none">
                    <h2 className="text-2xl font-bold text-police-dark uppercase tracking-wide border-b-2 border-police-light inline-block pb-2 mb-6">
                        I. Chức năng - Nhiệm vụ
                    </h2>
                    <p className="text-lg leading-relaxed text-slate-700">
                        Phòng Tổ chức cán bộ - Công an tỉnh Cao Bằng là đơn vị tham mưu giúp Giám đốc Công an tỉnh ... và công tác tuyển sinh, đào tạo, bồi dưỡng cán bộ chiến sĩ trong toàn lực lượng Công an tỉnh.
                    </p>
                    <p className="text-lg leading-relaxed text-slate-700">
                        Đặc biệt trong công tác tuyển sinh, chúng tôi là cơ quan thường trực Hội đồng Tuyển sinh Công an tỉnh, chịu trách nhiệm hướng dẫn, kiểm tra, giải đáp các thắc mắc về tiêu chuẩn, điều kiện, hồ sơ xét tuyển vào các trường Công an nhân dân (CAND) cho thí sinh trên địa bàn toàn tỉnh.
                    </p>

                    <h2 className="text-2xl font-bold text-police-dark uppercase tracking-wide border-b-2 border-police-light inline-block pb-2 mt-10 mb-6">
                        II. Website Tuyển sinh CA Cao Bằng
                    </h2>
                    <p className="text-lg leading-relaxed text-slate-700">
                        Nhằm mục tiêu số hóa, cải cách thủ tục hành chính và tạo điều kiện thuận lợi tối đa cho các thí sinh có nguyện vọng đứng trong hàng ngũ Công an nhân dân, Trang Thông tin điện tử Tuyển sinh CA Cao Bằng chính thức ra mắt với các tính năng:
                    </p>
                    <ul className="list-disc pl-6 space-y-3 text-lg text-slate-700">
                        <li>Cập nhật tin tức, quy định, thông báo mới nhất từ Bộ Công an và Hội đồng tuyển sinh CA tỉnh.</li>
                        <li>Cung cấp hệ thống <strong>Trợ lý AI Trực tuyến ảo 24/7</strong> giúp trả lời  thắc mắc của thí sinh.</li>
                        <li>Cung cấp công cụ dự trắc tính điểm xét tuyển tự động, chính xác.</li>
                        <li>Tích hợp các văn bản quy phạm pháp luật, biểu mẫu hồ sơ sơ tuyển để thí sinh tải về dễ dàng.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-police-dark uppercase tracking-wide border-b-2 border-police-light inline-block pb-2 mt-10 mb-6">
                        III. Liên hệ & Hỗ trợ
                    </h2>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <strong className="text-police-dark min-w-[120px]">Cơ quan:</strong>
                                <span className="text-slate-700">Công an tỉnh Cao Bằng (Phòng Tổ chức cán bộ)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <strong className="text-police-dark min-w-[120px]">Điện thoại:</strong>
                                <span className="text-slate-700">0206.385.xxxx (Giờ hành chính)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <strong className="text-police-dark min-w-[120px]">Email:</strong>
                                <span className="text-slate-700">tuyensinhcb@gmail.com</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <strong className="text-police-dark min-w-[120px]">Facebook fanpage:</strong>
                                <a href="https://www.facebook.com/tuyensinhcacaobang" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    https://www.facebook.com/tuyensinhcacaobang
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <strong className="text-police-dark min-w-[120px]">Zalo OA:</strong>
                                <a href="https://zalo.me/0206385xxxx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    Tuyển sinh CA Cao Bằng
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    )
}
