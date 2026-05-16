'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'

export default function PhotoCarousel({ photos }: { photos: string[] }) {
  const [current, setCurrent] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  function onScroll() {
    if (!scrollRef.current) return
    const index = Math.round(
      scrollRef.current.scrollLeft / scrollRef.current.clientWidth
    )
    setCurrent(index)
  }

  return (
    <div>
      {/* 滑动容器 */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex overflow-x-auto"
        style={{
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {photos.map((src, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 w-full"
            style={{ aspectRatio: '4/3', scrollSnapAlign: 'start' }}
          >
            <Image
              src={src}
              alt={`照片${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 480px) 100vw, 480px"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* 小圆点指示器（多于1张才显示） */}
      {photos.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-2 pb-1">
          {photos.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === current ? 16 : 6,
                height: 6,
                background: i === current ? 'var(--primary)' : '#d4c4b0',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
