'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex items-center justify-around px-6 py-3 z-50"
      style={{ background: 'var(--nav-bg)', borderTop: '1px solid var(--border)' }}
    >
      <Link href="/" className="flex flex-col items-center gap-0.5">
        <span className="text-xl">🏠</span>
        <span
          className="text-[10px] font-medium"
          style={{ color: path === '/' ? 'var(--primary)' : 'var(--text-muted)' }}
        >
          动态
        </span>
      </Link>

      <Link href="/create">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl shadow-md"
          style={{ background: 'var(--primary)' }}
        >
          +
        </div>
      </Link>

      <Link href="/me" className="flex flex-col items-center gap-0.5">
        <span className="text-xl">👤</span>
        <span
          className="text-[10px] font-medium"
          style={{ color: path === '/me' ? 'var(--primary)' : 'var(--text-muted)' }}
        >
          我的
        </span>
      </Link>
    </nav>
  )
}
