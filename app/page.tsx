import Link from 'next/link'
import { MessageCircle, Calendar, ChevronRight, FileText, Bot, ArrowRight } from 'lucide-react'
import { getAllNews } from '@/utils/docxParser'
import NewsCarousel from '@/components/NewsCarousel'
import ScoreCalculator from '@/components/ScoreCalculator'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const newsData = await getAllNews()
  // Grab up to 5 top news for the carousel
  const topNews = newsData.slice(0, 5)

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-police-dark selection:text-white">
      {/* Formal Portal Header */}
      <header className="bg-white sticky top-0 z-50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]">
        {/* Top Banner (Red background) */}
        <div className="bg-police-dark text-white py-4 md:py-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-police-light/20 to-transparent skew-x-12 transform translate-x-10"></div>
          <div className="container mx-auto px-4 flex items-center justify-center md:justify-start gap-4 md:gap-6 relative z-10">
            <img src="/logo.png" alt="CAND Logo" className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            <div className="flex flex-col text-center md:text-left">
              <h2 className="text-sm md:text-xl font-bold uppercase tracking-widest text-police-accent mb-0.5 md:mb-1 drop-shadow-md">
                Phòng Tổ chức cán bộ - Công an tỉnh Cao Bằng
              </h2>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight drop-shadow-lg leading-tight">
                CỔNG THÔNG TIN TUYỂN SINH
              </h1>
            </div>
          </div>
        </div>

        {/* Transparentish Navigation Bar */}
        <nav className="bg-white/80 backdrop-blur-md text-police-nav border-b border-gray-100 relative">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-police-dark via-police-accent to-police-light"></div>
          <div className="container mx-auto px-4">
            <ul className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start space-x-1 md:space-x-8 text-sm md:text-base font-bold uppercase tracking-wide">
              <li>
                <Link href="/" className="inline-block py-4 px-2 hover:text-police-light transition-colors relative group">
                  Trang chủ
                  <span className="absolute -bottom-[1px] left-0 w-full h-1 bg-police-accent rounded-t-md opacity-100"></span>
                </Link>
              </li>
              <li>
                <Link href="/tin-tuc" className="inline-block py-4 px-2 hover:text-police-light transition-colors relative group">
                  Tin tức & Sự kiện
                  <span className="absolute -bottom-[1px] left-0 w-0 h-1 bg-police-accent rounded-t-md opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link href="/chatbot" className="inline-block py-4 px-2 hover:text-police-light transition-colors relative group">
                  Trợ lý AI
                  <span className="absolute -bottom-[1px] left-0 w-0 h-1 bg-police-accent rounded-t-md opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-300"></span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Main Content Portal Grid */}
      <main className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* Left Column (News Carousel - 70%) */}
          <div className="xl:col-span-8 flex flex-col gap-8">
            <section className="animate-slide-up">
              <NewsCarousel newsList={topNews} />
            </section>
          </div>

          {/* Right Column (Widgets - 30%) */}
          <div className="xl:col-span-4 flex flex-col gap-6 animate-slide-up [animation-delay:200ms]">

            {/* Widget: Chatbot (Glassmorphic vibe) */}
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

            {/* Widget: Tiện ích (Soft aesthetic) */}
            <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 relative">
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
                    <Link href="#" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50/80 hover:shadow-sm text-slate-600 hover:text-police-light transition-all group">
                      <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-police-100 group-hover:text-police-light transition-colors">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-police-light" />
                      </div>
                      <span className="font-semibold text-sm">Quy chuẩn sức khỏe Công an</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-police-light transition-transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50/80 hover:shadow-sm text-slate-600 hover:text-police-light transition-all group">
                      <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-police-100 group-hover:text-police-light transition-colors">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-police-light" />
                      </div>
                      <span className="font-semibold text-sm">Danh sách các trường CAND</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-police-light transition-transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            
          </div>
        </div>
      </main>

      {/* Modern Footer with Portal Root */}
      <footer className="bg-police-dark text-white mt-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-police-light/20 rounded-full blur-[100px] translate-y-1/2"></div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-5">
              <div className="bg-white p-2 rounded-2xl shadow-xl">
                <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl uppercase tracking-widest text-white drop-shadow">Trang Web Tuyển Sinh</h3>
                <h4 className="font-semibold text-police-accent text-sm tracking-wider uppercase mt-1">Phòng Tổ chức cán bộ - Công an tỉnh Cao Bằng</h4>
              </div>
            </div>
            <div className="text-gray-300 text-sm md:text-right leading-relaxed font-medium bg-black/20 p-5 rounded-3xl backdrop-blur-sm border border-white/5">
              <p className="flex items-center justify-center md:justify-end gap-2 mb-1">Email: <span className="text-white">tuyensinhcb@gmail.com</span></p>
              <p className="flex items-center justify-center md:justify-end gap-2 mb-3">Điện thoại: <span className="text-white">0206.385.xxxx</span></p>
              <div className="w-full h-[1px] bg-white/10 mb-3"></div>
              <p className="text-white/60">&copy;  Bản quyền thuộc về Phòng Tổ chức cán bộ - Công an tỉnh Cao Bằng.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
