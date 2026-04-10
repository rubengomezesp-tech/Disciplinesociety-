-- Phase 3 — orders table
-- Run this in Supabase → SQL Editor → New Query → Run

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  amount numeric(10, 2) not null,
  currency text not null default 'eur',
  status text not null default 'paid',
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

-- Index for fast per-user lookups
create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

-- Enable Row Level Security
alter table public.orders enable row level security;

-- Policy: users can only SELECT their own orders
drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = user_id);

-- NOTE: there is no INSERT/UPDATE/DELETE policy for authenticated users.
-- Only the service_role key (used by the Netlify Function) can write to this table.
-- This guarantees orders can only be created by the trusted Stripe webhook.
