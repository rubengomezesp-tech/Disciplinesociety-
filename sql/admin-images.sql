-- Discipline Society — admin-managed site images
-- Run in Supabase SQL Editor after sql/orders.sql.
--
-- 1) Create the first admin by replacing the email at the bottom.
-- 2) Log in at /admin.html with that same Supabase user.

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_images (
  slot text primary key,
  section text not null,
  label text not null,
  image_url text not null,
  alt text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;
alter table public.site_images enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.site_images to anon, authenticated;
grant insert, update, delete on public.site_images to authenticated;
grant select on public.site_admins to authenticated;

drop policy if exists "Admins can read their own admin row" on public.site_admins;
create policy "Admins can read their own admin row"
  on public.site_admins
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Public can read published site images" on public.site_images;
create policy "Public can read published site images"
  on public.site_images
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert site images" on public.site_images;
create policy "Admins can insert site images"
  on public.site_images
  for insert
  to authenticated
  with check (exists (
    select 1 from public.site_admins where user_id = auth.uid()
  ));

drop policy if exists "Admins can update site images" on public.site_images;
create policy "Admins can update site images"
  on public.site_images
  for update
  to authenticated
  using (exists (
    select 1 from public.site_admins where user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.site_admins where user_id = auth.uid()
  ));

drop policy if exists "Admins can delete site images" on public.site_images;
create policy "Admins can delete site images"
  on public.site_images
  for delete
  to authenticated
  using (exists (
    select 1 from public.site_admins where user_id = auth.uid()
  ));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read site image files" on storage.objects;
create policy "Public can read site image files"
  on storage.objects
  for select
  to public
  using (bucket_id = 'site-images');

drop policy if exists "Admins can upload site image files" on storage.objects;
create policy "Admins can upload site image files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'site-images'
    and exists (select 1 from public.site_admins where user_id = auth.uid())
  );

drop policy if exists "Admins can update site image files" on storage.objects;
create policy "Admins can update site image files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'site-images'
    and exists (select 1 from public.site_admins where user_id = auth.uid())
  )
  with check (
    bucket_id = 'site-images'
    and exists (select 1 from public.site_admins where user_id = auth.uid())
  );

drop policy if exists "Admins can delete site image files" on storage.objects;
create policy "Admins can delete site image files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'site-images'
    and exists (select 1 from public.site_admins where user_id = auth.uid())
  );

-- Replace this email with your Supabase Auth email, then run once.
-- insert into public.site_admins (user_id)
-- select id from auth.users where email = 'tu@email.com'
-- on conflict (user_id) do nothing;
