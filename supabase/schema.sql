-- ============================================================
-- 444 Кино — Supabase өгөгдлийн сан
-- Supabase → SQL Editor → New query → энэ бүх текстийг хуулж буулгаад → Run
-- ============================================================

-- Захиалгын хүснэгт: хэрэглэгч бүрт нэг мөр
create table if not exists public.subscriptions (
  user_id     uuid primary key references auth.users on delete cascade,
  plan        text        not null,                 -- 'week' | 'month' | 'year'
  status      text        not null default 'active',
  started_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

alter table public.subscriptions enable row level security;

-- Хэрэглэгч зөвхөн өөрийн захиалгыг харна
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- ТУРШИЛТЫН ТӨЛБӨР
-- Нэвтэрсэн хэрэглэгч мөнгө төлөхгүйгээр захиалга идэвхжүүлнэ.
-- QPay холбох үед энэ функцийг УСТГАЖ, төлбөр баталгаажсаны дараа
-- серверээс (service role) захиалга үүсгэнэ.
-- ------------------------------------------------------------
create or replace function public.start_test_subscription(p_plan text)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  d interval;
  r public.subscriptions;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  d := case p_plan
         when 'week'  then interval '7 days'
         when 'month' then interval '1 month'
         when 'year'  then interval '1 year'
       end;
  if d is null then
    raise exception 'unknown plan %', p_plan;
  end if;

  insert into public.subscriptions (user_id, plan, status, started_at, expires_at)
  values (auth.uid(), p_plan, 'active', now(), now() + d)
  on conflict (user_id) do update
    set plan       = excluded.plan,
        status     = 'active',
        started_at = now(),
        -- хугацаа дуусаагүй бол үлдсэн хугацаан дээр нэмнэ
        expires_at = greatest(public.subscriptions.expires_at, now()) + d
  returning * into r;

  return r;
end;
$$;

revoke all on function public.start_test_subscription(text) from public, anon;
grant execute on function public.start_test_subscription(text) to authenticated;
