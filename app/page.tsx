'use client'
import { useEffect, useState } from 'react'
import { supabase, type Post } from '@/lib/supabase'
import PostCard from '@/components/PostCard'
import ViewToggle, { type ViewMode } from '@/components/ViewToggle'
import GridThumbnail from '@/components/GridThumbnail'

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [counts, setCounts] = useState<Record<string, { likes: number; comments: number }>>({})
  const [mode, setMode] = useState<ViewMode>('timeline')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (!data) return

        const ids = data.map((p) => p.id)

        const [{ data: likes }, { data: comments }] = await Promise.all([
          supabase.from('likes').select('post_id').in('post_id', ids),
          supabase.from('comments').select('post_id').in('post_id', ids),
        ])

        const countMap: Record<string, { likes: number; comments: number }> = {}
        ids.forEach((id) => {
          countMap[id] = {
            likes: likes?.filter((l) => l.post_id === id).length ?? 0,
            comments: comments?.filter((c) => c.post_id === id).length ?? 0,
          }
        })

        setPosts(data)
        setCounts(countMap)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 pt-12 pb-3"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>
          大本钟留言墙
        </h1>
        <ViewToggle mode={mode} onChange={setMode} />
      </div>

      <div className="px-4 pt-4">
        {loading && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            加载中...
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            还没有留言，成为第一个吧 ✨
          </div>
        )}

        {mode === 'timeline' ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              likesCount={counts[post.id]?.likes ?? 0}
              commentsCount={counts[post.id]?.comments ?? 0}
            />
          ))
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post) => (
              <GridThumbnail key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
