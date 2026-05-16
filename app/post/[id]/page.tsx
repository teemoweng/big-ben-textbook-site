import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import LikeButton from '@/components/LikeButton'
import CommentList from '@/components/CommentList'
import CommentInput from '@/components/CommentInput'
import PhotoCarousel from '@/components/PhotoCarousel'

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ data: post }, { data: likes }, { data: comments }] = await Promise.all([
    supabase.from('posts').select('*').eq('id', id).single(),
    supabase.from('likes').select('id').eq('post_id', id),
    supabase.from('comments').select('*').eq('post_id', id).order('created_at'),
  ])

  if (!post) notFound()

  const photos = post.photo_urls?.length ? post.photo_urls : [post.photo_url]

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center px-4 pt-12 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="text-xl mr-3" style={{ color: 'var(--text-muted)' }}>←</Link>
        <span className="font-medium" style={{ color: 'var(--text)' }}>留言详情</span>
      </div>

      <PhotoCarousel photos={photos} />

      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium" style={{ color: 'var(--text)' }}>{post.animal_nickname}</span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {new Date(post.created_at).toLocaleDateString('zh-CN')}
          </span>
        </div>
        <p className="text-base leading-relaxed mb-5" style={{ color: 'var(--text)' }}>
          {post.message}
        </p>
        <LikeButton postId={post.id} initialCount={likes?.length ?? 0} />
      </div>
      <div className="mx-4" style={{ borderTop: '1px solid var(--border)' }} />
      <div className="px-4 pt-4">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
          评论 {comments?.length ? `(${comments.length})` : ''}
        </h2>
        <CommentList comments={comments ?? []} />
        <CommentInput postId={post.id} />
      </div>
    </div>
  )
}
