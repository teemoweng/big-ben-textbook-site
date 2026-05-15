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

-- Storage bucket policies (run in SQL Editor after creating the 'photos' bucket in the UI)
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict do nothing;

create policy "Anyone can upload photos" on storage.objects
  for insert with check (bucket_id = 'photos');

create policy "Anyone can read photos" on storage.objects
  for select using (bucket_id = 'photos');
