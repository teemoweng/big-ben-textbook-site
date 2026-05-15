import Image from 'next/image'
import Link from 'next/link'
import type { Post } from '@/lib/supabase'

export default function GridThumbnail({ post }: { post: Post }) {
  return (
    <Link href={`/post/${post.id}`}>
      <div className="relative w-full" style={{ aspectRatio: '1' }}>
        <Image
          src={post.photo_url}
          alt="留言照片"
          fill
          className="object-cover"
          sizes="160px"
        />
      </div>
    </Link>
  )
}
