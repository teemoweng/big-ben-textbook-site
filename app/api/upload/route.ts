import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'placeholder',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: '请上传图片文件' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: '图片不能超过 10MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('photos')
    .upload(filename, arrayBuffer, { contentType: file.type })

  if (error) {
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(filename)
  return NextResponse.json({ url: data.publicUrl })
}
