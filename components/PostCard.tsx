import Image from 'next/image'
import Link from 'next/link'
import type { Post } from '@/lib/supabase'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

export default function PostCard({ post, likesCount, commentsCount }: {
  post: Post
  likesCount: number
  commentsCount: number
}) {
  return (
    <Link href={`/post/${post.id}`}>
      <div
        className="rounded-2xl overflow-hidden mb-4 shadow-sm"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
          <Image
            src={post.photo_url}
            alt="留言照片"
            fill
            className="object-cover"
            sizes="480px"
          />
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {post.animal_nickname}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {timeAgo(post.created_at)}
            </span>
          </div>
          <p
            className="text-sm leading-relaxed line-clamp-2 mb-3"
            style={{ color: 'var(--text)' }}
          >
            {post.message}
          </p>
          <div className="flex gap-4">
            <span className="text-sm" style={{ color: 'var(--primary)' }}>♥ {likesCount}</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>💬 {commentsCount}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
