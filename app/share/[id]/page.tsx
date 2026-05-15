import { supabase } from '@/lib/supabase'
import ShareCard from '@/components/ShareCard'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 text-center">
        <div className="text-3xl mb-2">✓</div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>发布成功</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          你的留言已经加入大本钟留言墙
        </p>
      </div>

      {/* 分享卡片 */}
      <ShareCard post={post} />

      {/* 说明文字 */}
      <div
        className="mx-4 mt-4 px-4 py-3 rounded-2xl text-sm text-center leading-relaxed"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        📸 截图保存到相册<br />
        <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>
          {post.short_code}
        </span>
        {' '}是你的专属短码，换设备后可在「我的」页面找回帖子
      </div>

      {/* 返回按钮 */}
      <div className="px-4 mt-6 mb-4">
        <Link
          href="/"
          className="block w-full py-3 rounded-2xl text-center font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          去看看大家的留言 →
        </Link>
      </div>
    </div>
  )
}
