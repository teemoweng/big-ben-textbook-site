'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase, type Post } from '@/lib/supabase'
import { getOrCreateIdentity } from '@/lib/identity'

export default function MePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(true)
  const [shortCode, setShortCode] = useState('')
  const [foundPost, setFoundPost] = useState<Post | null | 'not-found'>(null)

  useEffect(() => {
    const { deviceId, nickname: nick } = getOrCreateIdentity()
    setNickname(nick)
    supabase
      .from('posts')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? [])
        setLoading(false)
      })
  }, [])

  async function lookupShortCode() {
    if (!shortCode.trim()) return
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('short_code', shortCode.trim().toUpperCase())
      .single()
    setFoundPost(data ?? 'not-found')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-4xl mb-2">🐾</div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{nickname}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {posts.length} 条留言
        </p>
      </div>

      {/* 我发布的 */}
      <div className="px-4 pt-5">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>我发布的</h2>
        {loading ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>加载中...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm mb-3">还没有留言</p>
            <Link
              href="/create"
              className="text-sm px-5 py-2 rounded-full"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              去发布
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 mb-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <div className="relative w-full" style={{ aspectRatio: '1' }}>
                  <Image src={post.photo_url} alt="我的留言" fill className="object-cover" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 短码找回 */}
      <div className="px-4 pb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>短码找回</h2>
        <div
          className="flex gap-2 items-center px-4 py-3 rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <input
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && lookupShortCode()}
            placeholder="输入 5 位短码"
            maxLength={5}
            className="flex-1 bg-transparent outline-none text-sm font-mono tracking-widest uppercase"
            style={{ color: 'var(--text)' }}
          />
          <button
            onClick={lookupShortCode}
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            找回
          </button>
        </div>

        {foundPost === 'not-found' && (
          <p className="text-sm mt-2 text-center" style={{ color: '#c0392b' }}>
            未找到对应帖子，请检查短码是否正确
          </p>
        )}
        {foundPost && foundPost !== 'not-found' && (
          <Link
            href={`/post/${foundPost.id}`}
            className="flex items-center gap-3 mt-3 px-4 py-3 rounded-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--primary)' }}
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <Image src={foundPost.photo_url} alt="" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{foundPost.animal_nickname}</p>
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                {foundPost.message}
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
