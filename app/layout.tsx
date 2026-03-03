import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import FloatingChat from '@/components/FloatingChat'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  title: 'Tuyển sinh - Công an tỉnh Cao Bằng',
  description: 'Website tuyển sinh của Công an tỉnh Cao Bằng - Phòng Tổ chức cán bộ',
}

import { GoogleAnalytics } from '@next/third-parties/google'

// ==========================================
// 🔴 LỆNH TẮT/BẬT BẢO TRÌ WEBSITE
// ==========================================
// THAO TÁC: Đổi giá trị `false` thành `true` để bật giao diện "Đang bảo trì" trên toàn bộ Web.
const MAINTENANCE_MODE = true;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Màn hình Bảo trì sẽ đè lấp mọi thành phần cũ
  if (MAINTENANCE_MODE) {
    return (
      <html lang="vi">
        <body className={inter.className}>
          <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 relative" style={{ backgroundImage: "url('/bg-don-vi.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
            <div className="absolute inset-0 bg-police-dark/90 backdrop-blur-sm"></div>
            <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 md:p-12 rounded-3xl shadow-2xl max-w-2xl w-full text-center">
              <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain mx-auto mb-6 drop-shadow-xl" />
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-md">
                Vui lòng đăng ký domain để tiếp tục sử dụng
              </h1>
              <div className="w-16 h-1 bg-police-light rounded-full mx-auto mb-6"></div>
              <p className="text-slate-200 mb-8 text-sm md:text-lg leading-relaxed">
                Vui lòng quay lại sau!
              </p>
              <div className="inline-block px-5 py-3 bg-yellow-500/20 text-yellow-300 font-semibold text-sm rounded-xl border border-yellow-500/30">
                <span className="animate-pulse">⏳ Đang xử lý cập nhật...</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    )
  }

  // Giao diện Web bình thường
  return (
    <html lang="vi">
      <body className={`overflow-x-hidden w-full ${inter.className}`}>
        {children}
        <FloatingChat />
      </body>
      <GoogleAnalytics gaId="G-TWPX1R9F2P" />
    </html>
  )
}

