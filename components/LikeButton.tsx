'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getOrCreateIdentity } from '@/lib/identity'

export default function LikeButton({ postId, initialCount }: {
  postId: string
  initialCount: number
}) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { deviceId } = getOrCreateIdentity()
    supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('device_id', deviceId)
      .single()
      .then(({ data }) => setLiked(!!data))
  }, [postId])

  async function toggle() {
    if (loading) return
    setLoading(true)
    const { deviceId } = getOrCreateIdentity()

    if (liked) {
      await supabase.from('likes').delete()
        .eq('post_id', postId).eq('device_id', deviceId)
      setCount((c) => c - 1)
      setLiked(false)
    } else {
      await supabase.from('likes').insert({ post_id: postId, device_id: deviceId })
      setCount((c) => c + 1)
      setLiked(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors"
      style={{
        background: liked ? '#fde8d8' : 'var(--card)',
        color: liked ? 'var(--primary)' : 'var(--text-muted)',
        border: `1px solid ${liked ? 'var(--primary)' : 'var(--border)'}`,
      }}
    >
      <span>{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  )
}
