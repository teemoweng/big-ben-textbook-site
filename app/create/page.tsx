'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { generateShortCode } from '@/lib/shortcode'
import { getOrCreateIdentity } from '@/lib/identity'

export default function CreatePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    setNickname(localStorage.getItem('bb_nickname') ?? '...')
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    const newPreviews = selected.map((f) => URL.createObjectURL(f))
    setFiles((prev) => [...prev, ...selected])
    setPreviews((prev) => [...prev, ...newPreviews])
    // reset input so same files can be re-selected
    e.target.value = ''
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index])
    setPreviews((prev) => prev.filter((_, i) => i !== index))
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!files.length || !message.trim()) return
    setSubmitting(true)
    setError('')

    try {
      // 1. 上传所有图片
      const uploadedUrls: string[] = []
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        uploadedUrls.push(data.url)
      }

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
      const { deviceId, nickname: nick } = getOrCreateIdentity()
      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert({
          short_code: shortCode,
          device_id: deviceId,
          animal_nickname: nick,
          photo_url: uploadedUrls[0],
          photo_urls: uploadedUrls,
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

  const canSubmit = files.length > 0 && message.trim().length > 0 && !submitting

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
        {/* 照片预览区 */}
        {previews.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {previews.map((src, i) => (
              <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden">
                <Image src={src} alt={`照片${i + 1}`} fill className="object-cover" sizes="96px" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                >
                  ✕
                </button>
              </div>
            ))}
            {/* 添加更多 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-24 h-24 rounded-xl flex flex-col items-center justify-center gap-1 text-xs"
              style={{ background: '#efe5d0', border: '2px dashed var(--border)', color: 'var(--text-muted)' }}
            >
              <span className="text-2xl">+</span>
              <span>添加</span>
            </button>
          </div>
        )}

        {/* 空状态上传区 */}
        {previews.length === 0 && (
          <div
            className="w-full rounded-2xl overflow-hidden cursor-pointer flex items-center justify-center"
            style={{ aspectRatio: '4/3', background: '#efe5d0', border: '2px dashed var(--border)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <span className="text-4xl">📷</span>
              <span className="text-sm">点击上传照片</span>
              <span className="text-xs">可多选，支持从相册或拍照</span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
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
          <span className="font-medium" style={{ color: 'var(--primary)' }}>{nickname}</span>
          <span>的身份发布</span>
        </div>

        {error && (
          <p className="text-sm text-center" style={{ color: '#c0392b' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
