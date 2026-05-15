'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getOrCreateIdentity } from '@/lib/identity'

export default function CommentInput({ postId }: { postId: string }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!text.trim() || submitting) return
    setSubmitting(true)
    const { deviceId, nickname } = getOrCreateIdentity()

    await supabase.from('comments').insert({
      post_id: postId,
      device_id: deviceId,
      animal_nickname: nickname,
      content: text.trim().slice(0, 200),
    })

    setText('')
    setSubmitting(false)
    router.refresh()
  }

  return (
    <div
      className="flex gap-3 items-center mt-4 px-3 py-2 rounded-2xl sticky bottom-24"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="写评论…"
        maxLength={200}
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: 'var(--text)' }}
      />
      <button
        onClick={submit}
        disabled={!text.trim() || submitting}
        className="text-sm font-semibold px-3 py-1 rounded-full"
        style={{
          background: text.trim() ? 'var(--primary)' : 'transparent',
          color: text.trim() ? '#fff' : 'var(--text-muted)',
        }}
      >
        发
      </button>
    </div>
  )
}
