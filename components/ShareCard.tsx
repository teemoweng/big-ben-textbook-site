import Image from 'next/image'
import type { Post } from '@/lib/supabase'

export default function ShareCard({ post }: { post: Post }) {
  return (
    <div
      id="share-card"
      className="rounded-3xl overflow-hidden mx-4"
      style={{
        background: 'linear-gradient(160deg, #2d1b0e 0%, #4a2c0a 100%)',
        boxShadow: '0 8px 32px rgba(184,115,51,0.3)',
      }}
    >
      {/* 照片 */}
      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
        <Image src={post.photo_url} alt="留言照片" fill className="object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(45,27,14,0.8))' }}
        />
      </div>

      {/* 内容 */}
      <div className="px-5 py-4">
        <p className="text-sm font-medium mb-0.5" style={{ color: '#d4a96a' }}>
          {post.animal_nickname}
        </p>
        <p className="text-base leading-relaxed mb-4" style={{ color: '#f5e6d0' }}>
          {post.message.slice(0, 80)}{post.message.length > 80 ? '…' : ''}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#92795a' }}>大本钟留言墙</span>
          <div
            className="px-3 py-1 rounded-lg font-mono text-sm font-bold tracking-widest"
            style={{ background: 'rgba(184,115,51,0.3)', color: '#d4a96a' }}
          >
            {post.short_code}
          </div>
        </div>
      </div>
    </div>
  )
}
