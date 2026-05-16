# 大本钟留言墙

一个为「大本钟英语课本接力」活动设计的移动端留言网站。

参与者在伦敦大本钟附近发现一本中国人教版英语课本，扫描现场二维码进入，浏览陌生人的留言，上传自己的照片和文字，生成可截图保存的分享卡片——把实体书上会消失的记忆，变成数字留存。

## 线上地址

https://big-ben-textbook-site.vercel.app

## 核心功能

- **留言墙**：时间流 / 照片墙两种视图切换
- **发布**：上传多张照片 + 写留言，发布后生成带短码的分享卡片
- **详情页**：照片左右滑动轮播（小圆点指示），点赞，评论
- **我的页面**：查看本设备发过的帖子；输入短码可跨设备找回帖子
- **匿名身份**：随机动物昵称（如「温柔松鼠」），无需注册

## 技术栈

- **前端 / 全栈**：Next.js 16（App Router，TypeScript）
- **样式**：Tailwind CSS v4
- **数据库 & 存储**：Supabase（PostgreSQL + Storage）
- **部署**：Vercel
- **测试**：Vitest + React Testing Library

## 本地开发

```bash
npm install
cp .env.local.example .env.local
# 填入 Supabase URL 和 anon key
npm run dev
```

打开 http://localhost:3000

```bash
npm run test:run   # 运行单元测试
npm run build      # 生产构建
```

## 项目背景

源自小红书上的真实事件：一本放在大本钟附近的中国英语课本，吸引了无数路过的中国游客留言打卡。实体书会损坏、会消失，这个网站是它的数字延续。
