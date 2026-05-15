'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { generateShortCode } from '@/lib/shortcode'
import { getOrCreateIdentity } from '@/lib/identity'

export default function CreatePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit() {
    if (!file || !message.trim()) return
    setSubmitting(true)
    setError('')

    try {
      // 1. 上传图片
      const form = new FormData()
      form.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error)

      // 2. 生成短码（确保唯一）
      let shortCode = generateShortCode()
      let attempts = 0
      while (attempts < 5) {
        const { data } = await supabase
          .from('posts')
          .select('id')
          .eq('short_code', shortCode)
          .single()
        if (!data) break
        shortCode = generateShortCode()
        attempts++
      }

      // 3. 写入数据库
      const { deviceId, nickname } = getOrCreateIdentity()
      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert({
          short_code: shortCode,
          device_id: deviceId,
          animal_nickname: nickname,
          photo_url: uploadData.url,
          message: message.trim(),
        })
        .select()
        .single()

      if (insertError || !post) throw new Error('发布失败，请重试')

      router.push(`/share/${post.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '发布失败，请重试')
      setSubmitting(false)
    }
  }

  const canSubmit = !!file && message.trim().length > 0 && !submitting

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-12 pb-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => router.back()}
          className="text-2xl"
          style={{ color: 'var(--text-muted)' }}
        >
          ✕
        </button>
        <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          发布留言
        </h1>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="text-sm font-semibold px-4 py-1.5 rounded-full transition-opacity"
          style={{
            background: canSubmit ? 'var(--primary)' : '#d4c4b0',
            color: '#fff',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? '发布中...' : '发布'}
        </button>
      </div>

      <div className="px-4 py-6 flex flex-col gap-5">
        {/* 照片上传区 */}
        <div
          className="w-full rounded-2xl overflow-hidden cursor-pointer flex items-center justify-center"
          style={{
            aspectRatio: '4/3',
            background: preview ? 'transparent' : '#efe5d0',
            border: preview ? 'none' : '2px dashed var(--border)',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <div className="relative w-full h-full">
              <Image src={preview} alt="预览" fill className="object-cover" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <span className="text-4xl">📷</span>
              <span className="text-sm">点击上传照片</span>
              <span className="text-xs">支持从相册选取或拍照</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 留言输入 */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="写下你的留言…"
          maxLength={500}
          rows={4}
          className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />

        {/* 当前昵称 */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <span>以</span>
          <span className="font-medium" style={{ color: 'var(--primary)' }}>
            {typeof window !== 'undefined'
              ? (localStorage.getItem('bb_nickname') ?? '...')
              : '...'}
          </span>
          <span>的身份发布</span>
        </div>

        {error && (
          <p className="text-sm text-center" style={{ color: '#c0392b' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
