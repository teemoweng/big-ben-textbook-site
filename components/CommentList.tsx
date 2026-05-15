import type { Comment } from '@/lib/supabase'

export default function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
        还没有评论，来说点什么吧
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: 'var(--nav-bg)' }}
          >
            {c.animal_nickname.slice(-1)}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {c.animal_nickname}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(c.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              {c.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
