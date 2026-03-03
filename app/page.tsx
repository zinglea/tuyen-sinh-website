import Link from 'next/link'
import { MessageCircle, Calendar, ChevronRight, FileText, Bot, ArrowRight, Phone, Mail, MapPin } from 'lucide-react'
import { getAllNews } from '@/utils/docxParser'
import { getSupabaseNews } from '@/utils/supabase/data'
import NewsCarousel from '@/components/NewsCarousel'
import ScoreCalculator from '@/components/ScoreCalculator'
import VisitorCounter from '@/components/VisitorCounter'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [allData, supabaseNews] = await Promise.all([
    getAllNews(),
    getSupabaseNews(),
  ])

  // Filter out raw documents so they don't appear in the main News section
  const localNews = allData.filter(article => article.contentType !== 'raw_document')

  // Convert Supabase news to same format as local news
  const supabaseFormatted = supabaseNews.map(item => ({
    id: item.id,
    slug: `baiviet-${item.id}`,
    title: item.title,
    date: item.created_at,
    category: item.category || 'Tin tức',
    excerpt: item.content?.substring(0, 150) || '',
    image: item.image_url || '/logo.png',
    contentType: 'supabase_news' as const,
    author: item.author || 'Admin',
    contentHtml: '',
  }))

  const combinedNews = [...supabaseFormatted, ...localNews]
  const topNews = combinedNews.slice(0, 5)

  return (
    <div className="min-h-screen font-sans selection:bg-police-dark selection:text-white bg-transparent">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* Left Column (News) */}
          <div className="xl:col-span-8 flex flex-col gap-8">
            <section className="animate-slide-up">
              <NewsCarousel newsList={topNews} />
            </section>
          </div>

          {/* Right Column (Widgets) */}
          <div className="xl:col-span-4 flex flex-col gap-6 animate-slide-up [animation-delay:200ms]">

            {/* Widget: Chatbot */}
            <div className="relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/50 group">
              <div className="absolute inset-0 bg-gradient-to-br from-police-dark to-police-light opacity-95 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center blend-multiply opacity-20"></div>
              <div className="relative z-10 p-8 text-center text-white flex flex-col items-center justify-center h-full">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6 ring-2 ring-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                  <MessageCircle className="w-10 h-10 text-police-accent animate-pulse-slow" />
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-wider mb-2 drop-shadow-md text-police-accent">
                  Bạn có thắc mắc?
                </h3>
                <p className="text-blue-50 text-sm font-medium mb-8 leading-relaxed px-2">
                  Trợ lý thông minh AI 24/7 của Phòng Tổ chức cán bộ - Công an tỉnh Cao Bằng sẽ giải đáp thủ tục nhanh chóng nhất!
                </p>
                <Link
                  href="/chatbot"
                  className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white text-white hover:text-police-dark font-extrabold py-3.5 px-8 rounded-full transition-all duration-300 shadow-lg backdrop-blur-md border border-white/30 uppercase tracking-widest text-sm translate-y-0 group-hover:-translate-y-1"
                >
                  Trò chuyện ngay <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Widget: Hỏi đáp qua MXH */}
            <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                  Hỏi đáp trực tuyến
                </h3>
              </div>
              <div className="p-4 space-y-2">
                <a
                  href="https://zalo.me/0206385xxxx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <span className="text-white font-extrabold text-sm">Zalo</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Zalo: Tuyển sinh CA Cao Bằng</p>
                    <p className="text-xs text-slate-400">Nhắn tin tư vấn trực tiếp</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="https://www.facebook.com/tuyensinhcacaobang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                    <span className="text-white font-extrabold text-lg">f</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Facebook: Tuyển sinh CAND</p>
                    <p className="text-xs text-slate-400">Fanpage thông tin chính thức</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            {/* Widget: Tiện ích */}
            <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-police-light rounded-full"></div>
                  Tiện ích cần thiết
                </h3>
              </div>
              <div className="p-2">
                <ul className="space-y-1">
                  <li>
                    <ScoreCalculator />
                  </li>
                  <li>
                    <Link href="#" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50/80 hover:shadow-sm text-slate-600 hover:text-police-light transition-all group">
                      <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-police-100 group-hover:text-police-light transition-colors">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-police-light" />
                      </div>
                      <span className="font-semibold text-sm">Tải về mẫu đơn sơ tuyển</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-police-light transition-transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/tien-ich/suc-khoe" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50/80 hover:shadow-sm text-slate-600 hover:text-police-light transition-all group">
                      <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-police-100 group-hover:text-police-light transition-colors">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-police-light" />
                      </div>
                      <span className="font-semibold text-sm line-clamp-2">Tiêu chuẩn sức khỏe tuyển sinh, tuyển mới vào CAND</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-police-light transition-transform group-hover:translate-x-1 shrink-0" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/tien-ich/danh-ba-truong" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50/80 hover:shadow-sm text-slate-600 hover:text-police-light transition-all group">
                      <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-police-100 group-hover:text-police-light transition-colors">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-police-light" />
                      </div>
                      <span className="font-semibold text-sm">Danh sách các trường CAND</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-police-light transition-transform group-hover:translate-x-1 shrink-0" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Widget: Visitor Counter */}
            <VisitorCounter />

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="bg-police-dark text-white mt-12 relative overflow-hidden bg-cover bg-[center_10%]"
        style={{ backgroundImage: "url('/bg-don-vi.jpg')" }}
      >
        {/* Lớp phủ mờ chìm ảnh vàng xuống */}
        <div className="absolute inset-0 bg-police-dark/95 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-police-dark via-police-dark/90 to-transparent"></div>
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-police-light/20 rounded-full blur-[100px] translate-y-1/2"></div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

            {/* Col 1: Logo & Info */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-2xl shadow-xl">
                  <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg uppercase tracking-widest text-white drop-shadow">Website Tuyển Sinh</h3>
                  <h4 className="font-semibold text-police-accent text-xs tracking-wider uppercase mt-0.5">Phòng TCCB - CA tỉnh Cao Bằng</h4>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed text-center md:text-left mt-2">
                Cổng thông tin tuyển sinh chính thức của lực lượng Công an nhân dân tỉnh Cao Bằng. Cung cấp đầy đủ thông tin, hỗ trợ thí sinh 24/7.
              </p>
            </div>

            {/* Col 2: Liên hệ */}
            <div className="text-center md:text-left">
              <h4 className="font-bold text-police-accent text-sm uppercase tracking-wider mb-4">Thông tin liên hệ</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-3 justify-center md:justify-start">
                  <MapPin className="w-4 h-4 text-police-accent flex-shrink-0" />
                  <span>Phòng TCCB, Công an tỉnh Cao Bằng</span>
                </li>
                <li className="flex items-center gap-3 justify-center md:justify-start">
                  <Phone className="w-4 h-4 text-police-accent flex-shrink-0" />
                  <span>0206.385.xxxx</span>
                </li>
                <li className="flex items-center gap-3 justify-center md:justify-start">
                  <Mail className="w-4 h-4 text-police-accent flex-shrink-0" />
                  <span>tuyensinhcb@gmail.com</span>
                </li>
              </ul>
            </div>

            {/* Col 3: Kết nối */}
            <div className="text-center md:text-left">
              <h4 className="font-bold text-police-accent text-sm uppercase tracking-wider mb-4">Kết nối với chúng tôi</h4>
              <div className="flex gap-3 justify-center md:justify-start">
                <a
                  href="https://www.facebook.com/tuyensinhcacaobang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-white/10 hover:bg-[#1877F2] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
                  title="Facebook"
                >
                  <span className="text-white font-bold text-lg">f</span>
                </a>
                <a
                  href="https://zalo.me/0206385xxxx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-white/10 hover:bg-blue-500 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-400/30"
                  title="Zalo"
                >
                  <span className="text-white font-bold text-xs">Zalo</span>
                </a>
                <Link
                  href="/chatbot"
                  className="w-11 h-11 rounded-xl bg-white/10 hover:bg-police-accent flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/30"
                  title="Chatbot AI"
                >
                  <Bot className="w-5 h-5 text-white" />
                </Link>
              </div>
              <p className="text-gray-400 text-xs mt-4 leading-relaxed">
                Theo dõi để cập nhật thông tin tuyển sinh mới nhất từ CA tỉnh Cao Bằng.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-white/50 text-xs">&copy; {new Date().getFullYear()} Phòng Tổ chức cán bộ - Công an tỉnh Cao Bằng. Bản quyền được bảo lưu.</p>
            <p className="text-white/30 text-xs">Phát triển bởi Phòng TCCB | Hệ thống AI hỗ trợ tuyển sinh</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
