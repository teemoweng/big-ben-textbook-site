import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Post = {
  id: string
  short_code: string
  device_id: string
  animal_nickname: string
  photo_url: string
  message: string
  created_at: string
  likes_count?: number
  comments_count?: number
}

export type Comment = {
  id: string
  post_id: string
  device_id: string
  animal_nickname: string
  content: string
  created_at: string
}
