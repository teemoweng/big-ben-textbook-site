import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: '大本钟留言墙',
  description: '英语课本接力 · 陌生人之间的连接',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
