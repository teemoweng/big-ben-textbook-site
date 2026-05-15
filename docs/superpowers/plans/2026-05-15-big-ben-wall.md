# 大本钟留言墙 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个移动端优先的留言网站，让大本钟英语课本接力活动的参与者可以上传照片和留言，浏览他人内容，点赞评论，并生成可截图保存的分享卡片。

**Architecture:** Next.js 14 App Router 作为全栈框架，Supabase 提供 PostgreSQL 数据库、文件存储和实时订阅，Tailwind CSS 负责移动端优先的暖色系 UI。用户身份通过 localStorage 实现（设备绑定动物昵称 + 发帖后生成短码），无需注册登录。

**Tech Stack:** Next.js 14 (App Router, TypeScript), Tailwind CSS, Supabase (DB + Storage + Realtime), Vitest + React Testing Library, Vercel (deployment)

---

## 文件结构

```
big-ben-textbook-site/
├── app/
│   ├── layout.tsx              # 根布局：底部导航 + 全局字体
│   ├── page.tsx                # 动态墙（时间流/照片墙切换）
│   ├── post/[id]/page.tsx      # 帖子详情（照片 + 留言 + 点赞 + 评论）
│   ├── create/page.tsx         # 发布页（上传照片 + 写留言）
│   ├── share/[id]/page.tsx     # 分享卡片页（发布成功后）
│   ├── me/page.tsx             # 我的页（我的帖子 + 短码找回）
│   └── api/
│       └── upload/route.ts     # 照片上传 API（写入 Supabase Storage）
├── components/
│   ├── BottomNav.tsx           # 底部固定导航栏
│   ├── ViewToggle.tsx          # 动态/照片墙胶囊切换按钮
│   ├── PostCard.tsx            # 时间流中的单条帖子卡片
│   ├── GridThumbnail.tsx       # 照片墙中的单张缩略图
│   ├── LikeButton.tsx          # 点赞按钮（含本地状态）
│   ├── CommentList.tsx         # 评论列表
│   ├── CommentInput.tsx        # 评论输入框
│   └── ShareCard.tsx           # 分享卡片（截图友好）
├── lib/
│   ├── supabase.ts             # Supabase 客户端（browser + server）
│   ├── identity.ts             # 设备 ID + 动物昵称生成/读取
│   └── shortcode.ts            # 5 位短码生成
├── hooks/
│   └── useIdentity.ts          # React hook，暴露 { deviceId, nickname }
└── tests/
    ├── lib/identity.test.ts
    └── lib/shortcode.test.ts
```

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `.env.local.example`
- Create: `app/layout.tsx`, `app/globals.css`

- [ ] **Step 1: 创建 Next.js 项目**

```bash
cd /Users/teemo
npx create-next-app@latest big-ben-textbook-site \
  --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd big-ben-textbook-site
```

- [ ] **Step 2: 安装依赖**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: 配置 Vitest**

在项目根目录创建 `vitest.config.ts`：

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
})
```

创建 `tests/setup.ts`：

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: 添加测试脚本到 package.json**

在 `package.json` 的 `scripts` 里加入：

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: 创建环境变量模板**

创建 `.env.local.example`：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 6: 设置全局样式（暖色主题）**

替换 `app/globals.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #fdf6e9;
  --card: #ffffff;
  --primary: #b87333;
  --text: #3d2b1f;
  --text-muted: #92795a;
  --border: #e8d9c0;
  --nav-bg: #efe5d0;
}

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  max-width: 480px;
  margin: 0 auto;
}
```

- [ ] **Step 7: 配置根布局**

替换 `app/layout.tsx`（先写最小版本，Task 4 再加底部导航）：

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '大本钟留言墙',
  description: '英语课本接力 · 陌生人之间的连接',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen" style={{ background: 'var(--bg)' }}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 8: 验证项目启动**

```bash
npm run dev
```

预期：浏览器打开 `http://localhost:3000`，看到默认 Next.js 页面，无报错。

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "feat: initialize Next.js project with Tailwind and Vitest"
```

---

## Task 2: Supabase 数据库 Schema

**Files:**
- Create: `supabase/schema.sql`（仅作记录，实际在 Supabase 控制台执行）
- Create: `lib/supabase.ts`

- [ ] **Step 1: 在 Supabase 控制台创建项目**

访问 https://app.supabase.com → New Project → 记录 Project URL 和 anon key。

- [ ] **Step 2: 在 Supabase SQL Editor 执行 schema**

创建 `supabase/schema.sql`（便于版本管理），同时在控制台 SQL Editor 执行：

```sql
-- 帖子表
create table posts (
  id uuid default gen_random_uuid() primary key,
  short_code text unique not null,
  device_id text not null,
  animal_nickname text not null,
  photo_url text not null,
  message text not null,
  created_at timestamptz default now()
);

-- 评论表
create table comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  device_id text not null,
  animal_nickname text not null,
  content text not null,
  constraint content_length check (char_length(content) <= 200),
  created_at timestamptz default now()
);

-- 点赞表（device_id + post_id 唯一，防重复点赞）
create table likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  device_id text not null,
  created_at timestamptz default now(),
  unique(post_id, device_id)
);

-- RLS（Row Level Security）：允许所有人读，允许任何人写
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;

create policy "Anyone can read posts" on posts for select using (true);
create policy "Anyone can insert posts" on posts for insert with check (true);

create policy "Anyone can read comments" on comments for select using (true);
create policy "Anyone can insert comments" on comments for insert with check (true);

create policy "Anyone can read likes" on likes for select using (true);
create policy "Anyone can insert likes" on likes for insert with check (true);
create policy "Anyone can delete their own like" on likes for delete using (true);
```

- [ ] **Step 3: 在 Supabase 创建 Storage bucket**

在 Supabase 控制台 → Storage → New Bucket：
- Name: `photos`
- Public: ✅ 开启（图片需要公开访问）

在 SQL Editor 追加执行：

```sql
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict do nothing;

create policy "Anyone can upload photos" on storage.objects
  for insert with check (bucket_id = 'photos');

create policy "Anyone can read photos" on storage.objects
  for select using (bucket_id = 'photos');
```

- [ ] **Step 4: 创建 Supabase 客户端**

创建 `lib/supabase.ts`：

```typescript
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
```

- [ ] **Step 5: 配置环境变量**

复制 `.env.local.example` 为 `.env.local` 并填入真实值：

```bash
cp .env.local.example .env.local
# 编辑 .env.local，填入 Supabase URL 和 anon key
```

- [ ] **Step 6: 提交**

```bash
git add supabase/schema.sql lib/supabase.ts .env.local.example
git commit -m "feat: add Supabase schema and client"
```

---

## Task 3: 身份系统（动物昵称 + 设备 ID）

**Files:**
- Create: `lib/identity.ts`
- Create: `hooks/useIdentity.ts`
- Create: `tests/lib/identity.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/lib/identity.test.ts`：

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateNickname, getOrCreateIdentity } from '@/lib/identity'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} },
  }
})()

beforeEach(() => {
  localStorageMock.clear()
  vi.stubGlobal('localStorage', localStorageMock)
  vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1234' })
})

describe('generateNickname', () => {
  it('returns a non-empty string', () => {
    expect(generateNickname().length).toBeGreaterThan(0)
  })

  it('contains an adjective and an animal', () => {
    const result = generateNickname()
    // 格式：形容词 + 动物（总长度 > 2 个字）
    expect(result.length).toBeGreaterThan(2)
  })
})

describe('getOrCreateIdentity', () => {
  it('creates new identity on first call', () => {
    const { deviceId, nickname } = getOrCreateIdentity()
    expect(deviceId).toBe('test-uuid-1234')
    expect(nickname.length).toBeGreaterThan(0)
  })

  it('returns same identity on subsequent calls', () => {
    const first = getOrCreateIdentity()
    const second = getOrCreateIdentity()
    expect(first.deviceId).toBe(second.deviceId)
    expect(first.nickname).toBe(second.nickname)
  })

  it('persists identity to localStorage', () => {
    getOrCreateIdentity()
    expect(localStorageMock.getItem('bb_device_id')).toBe('test-uuid-1234')
    expect(localStorageMock.getItem('bb_nickname')).toBeTruthy()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test:run tests/lib/identity.test.ts
```

预期：FAIL，报 `Cannot find module '@/lib/identity'`

- [ ] **Step 3: 实现 identity.ts**

创建 `lib/identity.ts`：

```typescript
const ADJECTIVES = ['蓝色', '慵懒', '活泼', '快乐', '神秘', '勇敢', '温柔', '闪亮', '可爱', '聪明']
const ANIMALS = ['企鹅', '熊猫', '狐狸', '兔子', '猫咪', '小鸭', '仓鼠', '猫头鹰', '海豚', '松鼠']

export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return adj + animal
}

export function getOrCreateIdentity(): { deviceId: string; nickname: string } {
  let deviceId = localStorage.getItem('bb_device_id')
  let nickname = localStorage.getItem('bb_nickname')

  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem('bb_device_id', deviceId)
  }
  if (!nickname) {
    nickname = generateNickname()
    localStorage.setItem('bb_nickname', nickname)
  }

  return { deviceId, nickname }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test:run tests/lib/identity.test.ts
```

预期：PASS，3 个测试全部通过。

- [ ] **Step 5: 创建 useIdentity hook**

创建 `hooks/useIdentity.ts`：

```typescript
'use client'
import { useState, useEffect } from 'react'
import { getOrCreateIdentity } from '@/lib/identity'

export function useIdentity() {
  const [identity, setIdentity] = useState<{ deviceId: string; nickname: string } | null>(null)

  useEffect(() => {
    setIdentity(getOrCreateIdentity())
  }, [])

  return identity
}
```

- [ ] **Step 6: 提交**

```bash
git add lib/identity.ts hooks/useIdentity.ts tests/lib/identity.test.ts
git commit -m "feat: add identity system with animal nickname generation"
```

---

## Task 4: 短码生成

**Files:**
- Create: `lib/shortcode.ts`
- Create: `tests/lib/shortcode.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/lib/shortcode.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { generateShortCode } from '@/lib/shortcode'

describe('generateShortCode', () => {
  it('returns exactly 5 characters', () => {
    expect(generateShortCode()).toHaveLength(5)
  })

  it('only contains allowed characters', () => {
    const ALLOWED = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/
    for (let i = 0; i < 100; i++) {
      expect(generateShortCode()).toMatch(ALLOWED)
    }
  })

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, generateShortCode))
    expect(codes.size).toBeGreaterThan(90)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test:run tests/lib/shortcode.test.ts
```

预期：FAIL，报 `Cannot find module '@/lib/shortcode'`

- [ ] **Step 3: 实现 shortcode.ts**

创建 `lib/shortcode.ts`：

```typescript
// 排除 0/O/1/I 等易混淆字符
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateShortCode(): string {
  return Array.from(
    { length: 5 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test:run tests/lib/shortcode.test.ts
```

预期：PASS，3 个测试全部通过。

- [ ] **Step 5: 提交**

```bash
git add lib/shortcode.ts tests/lib/shortcode.test.ts
git commit -m "feat: add short code generator"
```

---

## Task 5: 底部导航 + 核心布局

**Files:**
- Create: `components/BottomNav.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: 创建底部导航组件**

创建 `components/BottomNav.tsx`：

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex items-center justify-around px-6 py-3 z-50"
      style={{ background: 'var(--nav-bg)', borderTop: '1px solid var(--border)' }}
    >
      <Link href="/" className="flex flex-col items-center gap-0.5">
        <span className="text-xl">🏠</span>
        <span
          className="text-[10px] font-medium"
          style={{ color: path === '/' ? 'var(--primary)' : 'var(--text-muted)' }}
        >
          动态
        </span>
      </Link>

      <Link href="/create">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl shadow-md"
          style={{ background: 'var(--primary)' }}
        >
          +
        </div>
      </Link>

      <Link href="/me" className="flex flex-col items-center gap-0.5">
        <span className="text-xl">👤</span>
        <span
          className="text-[10px] font-medium"
          style={{ color: path === '/me' ? 'var(--primary)' : 'var(--text-muted)' }}
        >
          我的
        </span>
      </Link>
    </nav>
  )
}
```

- [ ] **Step 2: 更新根布局，加入底部导航和底部内边距**

替换 `app/layout.tsx`：

```typescript
import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: '大本钟留言墙',
  description: '英语课本接力 · 陌生人之间的连接',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
```

- [ ] **Step 3: 创建各页面的占位文件**

```bash
mkdir -p app/post/\[id\] app/create app/share/\[id\] app/me
echo "export default function PostPage() { return <div>帖子详情</div> }" > "app/post/[id]/page.tsx"
echo "export default function CreatePage() { return <div>发布</div> }" > app/create/page.tsx
echo "export default function SharePage() { return <div>分享卡片</div> }" > "app/share/[id]/page.tsx"
echo "export default function MePage() { return <div>我的</div> }" > app/me/page.tsx
```

- [ ] **Step 4: 验证底部导航**

```bash
npm run dev
```

打开 `http://localhost:3000`，确认底部显示三个导航图标，点击可跳转页面，当前页图标颜色为棕色。

- [ ] **Step 5: 提交**

```bash
git add components/BottomNav.tsx app/layout.tsx app/post app/create app/share app/me
git commit -m "feat: add bottom navigation and page structure"
```

---

## Task 6: 动态墙（时间流视图）

**Files:**
- Create: `components/PostCard.tsx`
- Create: `components/ViewToggle.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: 创建 PostCard 组件**

创建 `components/PostCard.tsx`：

```typescript
import Image from 'next/image'
import Link from 'next/link'
import type { Post } from '@/lib/supabase'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

export default function PostCard({ post, likesCount, commentsCount }: {
  post: Post
  likesCount: number
  commentsCount: number
}) {
  return (
    <Link href={`/post/${post.id}`}>
      <div
        className="rounded-2xl overflow-hidden mb-4 shadow-sm"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
          <Image
            src={post.photo_url}
            alt="留言照片"
            fill
            className="object-cover"
            sizes="480px"
          />
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {post.animal_nickname}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {timeAgo(post.created_at)}
            </span>
          </div>
          <p
            className="text-sm leading-relaxed line-clamp-2 mb-3"
            style={{ color: 'var(--text)' }}
          >
            {post.message}
          </p>
          <div className="flex gap-4">
            <span className="text-sm" style={{ color: 'var(--primary)' }}>♥ {likesCount}</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>💬 {commentsCount}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: 创建 ViewToggle 组件**

创建 `components/ViewToggle.tsx`：

```typescript
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
```

- [ ] **Step 3: 实现动态墙页面（时间流）**

替换 `app/page.tsx`：

```typescript
'use client'
import { useEffect, useState } from 'react'
import { supabase, type Post } from '@/lib/supabase'
import PostCard from '@/components/PostCard'
import ViewToggle, { type ViewMode } from '@/components/ViewToggle'
import GridThumbnail from '@/components/GridThumbnail'

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [counts, setCounts] = useState<Record<string, { likes: number; comments: number }>>({})
  const [mode, setMode] = useState<ViewMode>('timeline')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (!data) return

      const ids = data.map((p) => p.id)

      const [{ data: likes }, { data: comments }] = await Promise.all([
        supabase.from('likes').select('post_id').in('post_id', ids),
        supabase.from('comments').select('post_id').in('post_id', ids),
      ])

      const countMap: Record<string, { likes: number; comments: number }> = {}
      ids.forEach((id) => {
        countMap[id] = {
          likes: likes?.filter((l) => l.post_id === id).length ?? 0,
          comments: comments?.filter((c) => c.post_id === id).length ?? 0,
        }
      })

      setPosts(data)
      setCounts(countMap)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 pt-12 pb-3"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>
          大本钟留言墙
        </h1>
        <ViewToggle mode={mode} onChange={setMode} />
      </div>

      <div className="px-4 pt-4">
        {loading && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            加载中...
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            还没有留言，成为第一个吧 ✨
          </div>
        )}

        {mode === 'timeline' ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              likesCount={counts[post.id]?.likes ?? 0}
              commentsCount={counts[post.id]?.comments ?? 0}
            />
          ))
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post) => (
              <GridThumbnail key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 创建 GridThumbnail 组件（照片墙用）**

创建 `components/GridThumbnail.tsx`：

```typescript
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
```

- [ ] **Step 5: 验证动态墙**

```bash
npm run dev
```

打开 `http://localhost:3000`，确认：
- 顶部显示标题 + 胶囊切换
- 切换按钮在「动态」和「照片墙」之间切换
- 无帖子时显示引导文案

- [ ] **Step 6: 提交**

```bash
git add components/PostCard.tsx components/ViewToggle.tsx components/GridThumbnail.tsx app/page.tsx
git commit -m "feat: add feed page with timeline and grid view toggle"
```

---

## Task 7: 照片上传 API

**Files:**
- Create: `app/api/upload/route.ts`

- [ ] **Step 1: 创建上传 API**

创建 `app/api/upload/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
```

- [ ] **Step 2: 验证 API**

```bash
npm run dev
```

用 curl 测试：

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/any/image.jpg"
```

预期：返回 `{"url": "https://...supabase.co/storage/v1/object/public/photos/...jpg"}`

- [ ] **Step 3: 提交**

```bash
git add app/api/upload/route.ts
git commit -m "feat: add photo upload API route"
```

---

## Task 8: 发布页

**Files:**
- Modify: `app/create/page.tsx`

- [ ] **Step 1: 实现发布页**

替换 `app/create/page.tsx`：

```typescript
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
```

- [ ] **Step 2: 验证发布页**

```bash
npm run dev
```

打开 `http://localhost:3000/create`，确认：
- 照片上传区点击后可选图片，选中后显示预览
- 留言未填写时「发布」按钮置灰
- 两者都填后「发布」按钮变棕色可点击

- [ ] **Step 3: 提交**

```bash
git add app/create/page.tsx
git commit -m "feat: add create post page with photo upload"
```

---

## Task 9: 分享卡片页

**Files:**
- Create: `components/ShareCard.tsx`
- Modify: `app/share/[id]/page.tsx`

- [ ] **Step 1: 创建 ShareCard 组件**

创建 `components/ShareCard.tsx`：

```typescript
import Image from 'next/image'
import type { Post } from '@/lib/supabase'

export default function ShareCard({ post }: { post: Post }) {
  return (
    <div
      id="share-card"
      className="rounded-3xl overflow-hidden mx-4"
      style={{
        background: 'linear-gradient(160deg, #2d1b0e 0%, #4a2c0a 100%)',
        boxShadow: '0 8px 32px rgba(184,115,51,0.3)',
      }}
    >
      {/* 照片 */}
      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
        <Image src={post.photo_url} alt="留言照片" fill className="object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(45,27,14,0.8))' }}
        />
      </div>

      {/* 内容 */}
      <div className="px-5 py-4">
        <p className="text-sm font-medium mb-0.5" style={{ color: '#d4a96a' }}>
          {post.animal_nickname}
        </p>
        <p className="text-base leading-relaxed mb-4" style={{ color: '#f5e6d0' }}>
          {post.message.slice(0, 80)}{post.message.length > 80 ? '…' : ''}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#92795a' }}>大本钟留言墙</span>
          <div
            className="px-3 py-1 rounded-lg font-mono text-sm font-bold tracking-widest"
            style={{ background: 'rgba(184,115,51,0.3)', color: '#d4a96a' }}
          >
            {post.short_code}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 实现分享卡片页**

替换 `app/share/[id]/page.tsx`：

```typescript
import { supabase } from '@/lib/supabase'
import ShareCard from '@/components/ShareCard'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function SharePage({ params }: { params: { id: string } }) {
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!post) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 text-center">
        <div className="text-3xl mb-2">✓</div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>发布成功</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          你的留言已经加入大本钟留言墙
        </p>
      </div>

      {/* 分享卡片 */}
      <ShareCard post={post} />

      {/* 说明文字 */}
      <div
        className="mx-4 mt-4 px-4 py-3 rounded-2xl text-sm text-center leading-relaxed"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        📸 截图保存到相册<br />
        <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>
          {post.short_code}
        </span>
        {' '}是你的专属短码，换设备后可在「我的」页面找回帖子
      </div>

      {/* 返回按钮 */}
      <div className="px-4 mt-6">
        <Link
          href="/"
          className="block w-full py-3 rounded-2xl text-center font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          去看看大家的留言 →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 端到端验证发布流程**

```bash
npm run dev
```

完整走一遍流程：
1. 打开 `http://localhost:3000/create`
2. 选择一张本地图片
3. 填写留言文字
4. 点击「发布」
5. 等待跳转到分享卡片页

预期：分享卡片页显示照片、昵称、留言、短码（5位），截图说明文字清晰。

- [ ] **Step 4: 提交**

```bash
git add components/ShareCard.tsx app/share
git commit -m "feat: add share card page after post creation"
```

---

## Task 10: 帖子详情页 + 点赞

**Files:**
- Create: `components/LikeButton.tsx`
- Modify: `app/post/[id]/page.tsx`

- [ ] **Step 1: 创建 LikeButton 组件**

创建 `components/LikeButton.tsx`：

```typescript
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
    // 检查本设备是否已点赞
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
```

- [ ] **Step 2: 实现帖子详情页（不含评论，Task 11 补完）**

替换 `app/post/[id]/page.tsx`：

```typescript
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import LikeButton from '@/components/LikeButton'

export default async function PostPage({ params }: { params: { id: string } }) {
  const [{ data: post }, { data: likes }] = await Promise.all([
    supabase.from('posts').select('*').eq('id', params.id).single(),
    supabase.from('likes').select('id').eq('post_id', params.id),
  ])

  if (!post) notFound()

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="text-xl mr-3" style={{ color: 'var(--text-muted)' }}>←</Link>
        <span className="font-medium" style={{ color: 'var(--text)' }}>留言详情</span>
      </div>

      {/* 照片 */}
      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
        <Image src={post.photo_url} alt="留言照片" fill className="object-cover" />
      </div>

      {/* 内容 */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium" style={{ color: 'var(--text)' }}>{post.animal_nickname}</span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {new Date(post.created_at).toLocaleDateString('zh-CN')}
          </span>
        </div>
        <p className="text-base leading-relaxed mb-5" style={{ color: 'var(--text)' }}>
          {post.message}
        </p>
        <LikeButton postId={post.id} initialCount={likes?.length ?? 0} />
      </div>

      {/* 评论区占位，Task 11 补全 */}
      <div className="mx-4 mt-4" style={{ borderTop: '1px solid var(--border)' }} />
      <div className="px-4 pt-4">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>评论</h2>
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>评论功能即将上线</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 验证帖子详情**

发布一条帖子后，从动态墙点进帖子详情，确认：
- 照片全宽显示
- 昵称、时间、留言文字正确
- 点赞按钮点击后变色，刷新后状态保持

- [ ] **Step 4: 提交**

```bash
git add components/LikeButton.tsx app/post
git commit -m "feat: add post detail page with like button"
```

---

## Task 11: 评论系统

**Files:**
- Create: `components/CommentList.tsx`
- Create: `components/CommentInput.tsx`

- [ ] **Step 1: 创建 CommentList 组件**

创建 `components/CommentList.tsx`：

```typescript
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
```

- [ ] **Step 2: 创建 CommentInput 组件**

创建 `components/CommentInput.tsx`：

```typescript
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
```

- [ ] **Step 3: 更新帖子详情页，加入真实评论组件**

替换 `app/post/[id]/page.tsx`：

```typescript
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import LikeButton from '@/components/LikeButton'
import CommentList from '@/components/CommentList'
import CommentInput from '@/components/CommentInput'

export default async function PostPage({ params }: { params: { id: string } }) {
  const [{ data: post }, { data: likes }, { data: comments }] = await Promise.all([
    supabase.from('posts').select('*').eq('id', params.id).single(),
    supabase.from('likes').select('id').eq('post_id', params.id),
    supabase.from('comments').select('*').eq('post_id', params.id).order('created_at'),
  ])

  if (!post) notFound()

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center px-4 pt-12 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="text-xl mr-3" style={{ color: 'var(--text-muted)' }}>←</Link>
        <span className="font-medium" style={{ color: 'var(--text)' }}>留言详情</span>
      </div>
      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
        <Image src={post.photo_url} alt="留言照片" fill className="object-cover" />
      </div>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium" style={{ color: 'var(--text)' }}>{post.animal_nickname}</span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {new Date(post.created_at).toLocaleDateString('zh-CN')}
          </span>
        </div>
        <p className="text-base leading-relaxed mb-5" style={{ color: 'var(--text)' }}>
          {post.message}
        </p>
        <LikeButton postId={post.id} initialCount={likes?.length ?? 0} />
      </div>
      <div className="mx-4" style={{ borderTop: '1px solid var(--border)' }} />
      <div className="px-4 pt-4">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
          评论 {comments?.length ? `(${comments.length})` : ''}
        </h2>
        <CommentList comments={comments ?? []} />
        <CommentInput postId={post.id} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 验证评论功能**

打开一条帖子详情，在底部输入框写评论，点「发」，确认：
- 评论出现在列表中
- 刷新后评论仍在
- 空文本时「发」按钮无样式/禁用

- [ ] **Step 5: 提交**

```bash
git add components/CommentList.tsx components/CommentInput.tsx app/post
git commit -m "feat: add comment list, comment input, and complete post detail page"
```

---

## Task 12: 我的页面

**Files:**
- Modify: `app/me/page.tsx`

- [ ] **Step 1: 实现我的页面**

替换 `app/me/page.tsx`：

```typescript
'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase, type Post } from '@/lib/supabase'
import { getOrCreateIdentity } from '@/lib/identity'

export default function MePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(true)
  const [shortCode, setShortCode] = useState('')
  const [foundPost, setFoundPost] = useState<Post | null | 'not-found'>(null)

  useEffect(() => {
    const { deviceId, nickname: nick } = getOrCreateIdentity()
    setNickname(nick)
    supabase
      .from('posts')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? [])
        setLoading(false)
      })
  }, [])

  async function lookupShortCode() {
    if (!shortCode.trim()) return
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('short_code', shortCode.trim().toUpperCase())
      .single()
    setFoundPost(data ?? 'not-found')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-4xl mb-2">🐾</div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{nickname}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {posts.length} 条留言
        </p>
      </div>

      {/* 我发布的 */}
      <div className="px-4 pt-5">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>我发布的</h2>
        {loading ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>加载中...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm mb-3">还没有留言</p>
            <Link
              href="/create"
              className="text-sm px-5 py-2 rounded-full"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              去发布
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 mb-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <div className="relative w-full" style={{ aspectRatio: '1' }}>
                  <Image src={post.photo_url} alt="我的留言" fill className="object-cover" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 短码找回 */}
      <div className="px-4 pb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>短码找回</h2>
        <div
          className="flex gap-2 items-center px-4 py-3 rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <input
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && lookupShortCode()}
            placeholder="输入 5 位短码"
            maxLength={5}
            className="flex-1 bg-transparent outline-none text-sm font-mono tracking-widest uppercase"
            style={{ color: 'var(--text)' }}
          />
          <button
            onClick={lookupShortCode}
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            找回
          </button>
        </div>

        {foundPost === 'not-found' && (
          <p className="text-sm mt-2 text-center" style={{ color: '#c0392b' }}>
            未找到对应帖子，请检查短码是否正确
          </p>
        )}
        {foundPost && foundPost !== 'not-found' && (
          <Link
            href={`/post/${foundPost.id}`}
            className="flex items-center gap-3 mt-3 px-4 py-3 rounded-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--primary)' }}
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <Image src={foundPost.photo_url} alt="" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{foundPost.animal_nickname}</p>
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                {foundPost.message}
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证我的页面**

打开 `http://localhost:3000/me`，确认：
- 顶部显示动物昵称和发帖数
- 格子显示本设备发过的帖子
- 输入短码后点找回，能跳转到对应帖子

- [ ] **Step 3: 提交**

```bash
git add app/me/page.tsx
git commit -m "feat: add my page with post grid and short code lookup"
```

---

## Task 13: 部署到 Vercel

**Files:**
- Create: `vercel.json`（如需配置）

- [ ] **Step 1: 推送到 GitHub**

```bash
git remote add origin https://github.com/<your-username>/big-ben-textbook-site.git
git push -u origin main
```

- [ ] **Step 2: 在 Vercel 导入项目**

访问 https://vercel.com → Add New Project → 选择刚推送的 repo → Import。

- [ ] **Step 3: 配置环境变量**

在 Vercel 项目的 Settings → Environment Variables 中添加：

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
```

- [ ] **Step 4: 部署**

点击 Deploy。等待构建完成，Vercel 会给出一个 `*.vercel.app` 域名。

- [ ] **Step 5: 生成二维码**

获得 Vercel 域名后，用任意在线二维码生成工具（如 qr-code-generator.com）生成二维码，打印出来放在课本旁边。

- [ ] **Step 6: 验证线上版本**

用手机扫描二维码，走完完整流程：
- 扫码进入动态墙
- 点击 "+" 拍照上传（手机摄像头）
- 填写留言，发布
- 检查分享卡片页短码显示正常
- 返回动态墙能看到刚发的帖子

---

## 运行所有测试

```bash
npm run test:run
```

预期：identity 和 shortcode 的单元测试全部 PASS。
