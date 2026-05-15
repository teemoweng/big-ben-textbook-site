'use client'

export type ViewMode = 'timeline' | 'grid'

export default function ViewToggle({ mode, onChange }: {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  return (
    <div
      className="flex rounded-full p-0.5 mx-4 mb-4"
      style={{ background: '#e8d9c0' }}
    >
      {(['timeline', 'grid'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className="flex-1 py-1.5 rounded-full text-sm font-medium transition-colors"
          style={{
            background: mode === m ? 'var(--primary)' : 'transparent',
            color: mode === m ? '#fff' : 'var(--text-muted)',
          }}
        >
          {m === 'timeline' ? '动态' : '照片墙'}
        </button>
      ))}
    </div>
  )
}
