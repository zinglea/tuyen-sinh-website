import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  title: 'Tuyển sinh - Công an tỉnh Cao Bằng',
  description: 'Website tuyển sinh của Công an tỉnh Cao Bằng - Phòng Tổ chức cán bộ',
}

import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
      <GoogleAnalytics gaId="G-TWPX1R9F2P" />
    </html>
  )
}
