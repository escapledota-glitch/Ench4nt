-- ============================================================
-- 444 Кино — кино тус бүрийг худалдаж авах
-- Supabase → SQL Editor → New query → бүгдийг хуулж буулгаад → Run
-- Дахин ажиллуулахад аюулгүй.
-- ============================================================

-- Цуврал/кино бүрийн үнэ (₮). 0 = худалдахгүй (зөвхөн багцаар)
alter table public.series add column if not exists price int not null default 5900;

-- Хэрэглэгчийн худалдаж авсан кино
create table if not exists public.purchases (
  user_id    uuid not null references auth.users on delete cascade,
  series_id  text not null references public.series on delete cascade,
  price      int  not null,
  created_at timestamptz not null default now(),
  primary key (user_id, series_id)
);
alter table public.purchases enable row level security;

-- Хэрэглэгч зөвхөн өөрийн авсныг харна (бичих нь зөвхөн серверээр)
drop policy if exists "read own purchases" on public.purchases;
create policy "read own purchases" on public.purchases for select using (auth.uid() = user_id);
