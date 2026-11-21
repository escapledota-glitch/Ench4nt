-- ============================================================
-- 444 Кино — БҮГДИЙГ НЭГ ДОР (schema.sql + schema-v2.sql)
-- Supabase → SQL Editor → New query → Ctrl+A, Ctrl+V → Run
-- Дахин ажиллуулахад аюулгүй.
-- ============================================================

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


-- ============================================================
-- 444 Кино — 2-р хэсэг: админ, цуврал/анги, үзсэн түүх, мэдэгдэл
-- schema.sql-ийг ажиллуулсны ДАРАА үүнийг ажиллуулна.
-- Supabase → SQL Editor → New query → бүгдийг хуулж буулгаад → Run
-- Дахин ажиллуулахад аюулгүй.
-- ============================================================

-- ---------- Админ ----------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admin reads self" on public.admins;
create policy "admin reads self" on public.admins for select using (user_id = auth.uid());

-- Идэвхтэй багцтай эсэх
create or replace function public.has_active_subscription()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = auth.uid() and status = 'active' and expires_at > now()
  );
$$;
grant execute on function public.has_active_subscription() to anon, authenticated;

-- Админ бүх захиалгыг харна
drop policy if exists "admin reads all subscriptions" on public.subscriptions;
create policy "admin reads all subscriptions" on public.subscriptions for select using (public.is_admin());

-- ---------- Цуврал ----------
create table if not exists public.series (
  id            text primary key,              -- холбоосны нэр, ж: 'talyn-zurkh'
  title         text not null,
  description   text not null default '',
  genres        text[] not null default '{}',
  poster        text not null default '',      -- босоо зураг (3:4)
  backdrop      text not null default '',      -- хэвтээ зураг (16:9)
  badge         text,                          -- 'Онцлох' | 'Шинэ' | 'Топ' | null
  rating        numeric(2,1) not null default 4.5,
  views         text not null default '0',
  episodes      int not null default 1,
  free_episodes int not null default 10,
  free_minutes  int not null default 0,       -- багцгүй хүн түгжээтэй ангийг хэдэн минут үзэх (0 = огт үгүй)
  published     boolean not null default true,
  sort          int not null default 0,
  created_at    timestamptz not null default now()
);
-- Хуучин хүснэгтэд багана нэмэх (дахин ажиллуулахад аюулгүй)
alter table public.series add column if not exists free_minutes int not null default 0;

alter table public.series enable row level security;

drop policy if exists "public reads published series" on public.series;
create policy "public reads published series" on public.series
  for select using (published or public.is_admin());

drop policy if exists "admin manages series" on public.series;
create policy "admin manages series" on public.series
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Анги ----------
create table if not exists public.episodes (
  series_id  text not null references public.series on delete cascade,
  ep         int  not null,
  video_url  text not null,
  primary key (series_id, ep)
);
alter table public.episodes enable row level security;

-- Видео холбоосыг хөтөч шууд уншихгүй — зөвхөн сервер (/api/kino/stream) эрх шалгаад
-- хугацаатай гарын үсэгтэй холбоос олгоно. (Админ доорх бодлогоор бүрэн эрхтэй.)
drop policy if exists "read allowed episodes" on public.episodes;

drop policy if exists "admin manages episodes" on public.episodes;
create policy "admin manages episodes" on public.episodes
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Үзсэн түүх, хадгалсан ----------
create table if not exists public.watch_history (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  series_id  text not null,
  ep         int  not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, series_id)
);
alter table public.watch_history enable row level security;
drop policy if exists "own history" on public.watch_history;
create policy "own history" on public.watch_history
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.saved_series (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  series_id  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, series_id)
);
alter table public.saved_series enable row level security;
drop policy if exists "own saved" on public.saved_series;
create policy "own saved" on public.saved_series
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Мэдэгдэл ----------
create table if not exists public.notifications (
  id         bigint generated always as identity primary key,
  title      text not null,
  body       text not null default '',
  url        text,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
drop policy if exists "everyone reads notifications" on public.notifications;
create policy "everyone reads notifications" on public.notifications for select using (true);
drop policy if exists "admin manages notifications" on public.notifications;
create policy "admin manages notifications" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- Утсан дээрх push мэдэгдлийн бүртгэл
create table if not exists public.push_subscriptions (
  endpoint     text primary key,
  user_id      uuid references auth.users on delete set null,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
-- Шууд хандах эрхгүй; доорх функцуудаар л ажиллана.

create or replace function public.save_push_subscription(p_sub jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_sub->>'endpoint' is null then raise exception 'invalid subscription'; end if;
  insert into public.push_subscriptions (endpoint, user_id, subscription)
  values (p_sub->>'endpoint', auth.uid(), p_sub)
  on conflict (endpoint) do update set user_id = coalesce(auth.uid(), push_subscriptions.user_id), subscription = excluded.subscription;
end; $$;
grant execute on function public.save_push_subscription(jsonb) to anon, authenticated;

create or replace function public.remove_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;
grant execute on function public.remove_push_subscription(text) to anon, authenticated;

-- ---------- Админы функцууд ----------
create or replace function public.admin_push_subscriptions()
returns setof public.push_subscriptions language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query select * from public.push_subscriptions;
end; $$;
grant execute on function public.admin_push_subscriptions() to authenticated;

create or replace function public.admin_delete_push(p_endpoints text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  delete from public.push_subscriptions where endpoint = any(p_endpoints);
end; $$;
grant execute on function public.admin_delete_push(text[]) to authenticated;

create or replace function public.admin_list_users()
returns table (
  id uuid, email text, name text, created_at timestamptz, last_sign_in_at timestamptz,
  plan text, expires_at timestamptz, is_admin boolean
) language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
    select u.id, u.email::text,
           coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))::text,
           u.created_at, u.last_sign_in_at,
           s.plan, s.expires_at,
           exists (select 1 from public.admins a where a.user_id = u.id)
    from auth.users u
    left join public.subscriptions s on s.user_id = u.id
    order by u.created_at desc;
end; $$;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_grant_subscription(p_user uuid, p_plan text)
returns void language plpgsql security definer set search_path = public as $$
declare d interval;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  d := case p_plan when 'week' then interval '7 days' when 'month' then interval '1 month' when 'year' then interval '1 year' end;
  if d is null then raise exception 'unknown plan %', p_plan; end if;
  insert into public.subscriptions (user_id, plan, status, started_at, expires_at)
  values (p_user, p_plan, 'active', now(), now() + d)
  on conflict (user_id) do update
    set plan = excluded.plan, status = 'active', started_at = now(),
        expires_at = greatest(public.subscriptions.expires_at, now()) + d;
end; $$;
grant execute on function public.admin_grant_subscription(uuid, text) to authenticated;

create or replace function public.admin_cancel_subscription(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.subscriptions set status = 'cancelled', expires_at = now() where user_id = p_user;
end; $$;
grant execute on function public.admin_cancel_subscription(uuid) to authenticated;

create or replace function public.admin_stats()
returns json language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return json_build_object(
    'users',        (select count(*) from auth.users),
    'users_7d',     (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'active',       (select count(*) from public.subscriptions where status = 'active' and expires_at > now()),
    'by_plan',      (select coalesce(json_object_agg(plan, n), '{}'::json) from (
                       select plan, count(*) n from public.subscriptions
                       where status = 'active' and expires_at > now() group by plan) t),
    'series',       (select count(*) from public.series),
    'push',         (select count(*) from public.push_subscriptions),
    'watching_7d',  (select count(distinct user_id) from public.watch_history where updated_at > now() - interval '7 days')
  );
end; $$;
grant execute on function public.admin_stats() to authenticated;


-- ---------- Зураг хадгалах сан (постер, арын зураг) ----------
insert into storage.buckets (id, name, public)
values ('kino', 'kino', true)
on conflict (id) do nothing;

drop policy if exists "kino admin upload" on storage.objects;
create policy "kino admin upload" on storage.objects for insert
  with check (bucket_id = 'kino' and public.is_admin());
drop policy if exists "kino admin update" on storage.objects;
create policy "kino admin update" on storage.objects for update
  using (bucket_id = 'kino' and public.is_admin());
drop policy if exists "kino admin delete" on storage.objects;
create policy "kino admin delete" on storage.objects for delete
  using (bucket_id = 'kino' and public.is_admin());

-- ---------- Эхний өгөгдөл (жишээ цуврал) ----------
insert into public.series (id, title, description, genres, poster, backdrop, badge, rating, views, episodes, free_episodes, published, sort) values
  ('terbumtnii-nuuts-ekhner', 'Тэрбумтны нууц эхнэр', 'Энгийн кофе шопын ажилтан Сараа нэгэн шөнө танихгүй залуутай гэрээгээр гэрлэнэ. Маргааш нь тэр залуу хотын хамгийн баян компанийн захирал болох нь илэрнэ…', array['Романс', 'Гэр бүл']::text[], '/assets/images/mock/portrait/portrait-1.webp', '/assets/images/mock/cover/cover-1.webp', 'Онцлох', 4.9, '4.8 сая', 72, 10, true, 0),
  ('khaan-shireenii-uv', 'Хаан ширээний өв залгамжлагч', 'Хаант улсаас хөөгдсөн ханхүү жирийн малчны дүрд нуугдан амьдарна. Арван жилийн дараа тэрээр өв залгамжлалаа эргүүлэн авахаар ордонд буцаж ирнэ.', array['Түүхэн', 'Өшөө авалт']::text[], '/assets/images/mock/portrait/portrait-2.webp', '/assets/images/mock/cover/cover-2.webp', 'Шинэ', 4.8, '3.1 сая', 60, 10, true, 1),
  ('ushee-avaltiin-khatan', 'Өшөө авалтын хатан', 'Нөхөр болон хамгийн дотны найздаа урвагдсан Номин бүх зүйлээ алдана. Гэвч тэр шинэ нэр, шинэ дүр төрхтэй эргэн ирж, нэг нэгээр нь хариуг нь өгнө.', array['Өшөө авалт', 'Романс']::text[], '/assets/images/mock/portrait/portrait-3.webp', '/assets/images/mock/cover/cover-3.webp', 'Топ', 4.9, '6.2 сая', 80, 10, true, 2),
  ('khoyor-dakhi-amidral', 'Хоёр дахь амьдрал', 'Нас барсан Ану арван жилийн өмнөх өөрийн биед сэрнэ. Энэ удаад тэр гэр бүлээ аврах, хорон санаатнуудыг илчлэх боломжоо алдахгүй.', array['Уран зөгнөл', 'Гэр бүл']::text[], '/assets/images/mock/portrait/portrait-4.webp', '/assets/images/mock/cover/cover-4.webp', 'Шинэ', 4.7, '2.7 сая', 54, 10, true, 3),
  ('chonon-saran', 'Чонон сарны тангараг', 'Чонон овгийн удирдагч тэргэл сарны шөнө нууцлаг охинтой тааралдана. Тэдний хувь заяа эртний тангарагаар холбогдсон байжээ.', array['Уран зөгнөл', 'Романс']::text[], '/assets/images/mock/portrait/portrait-5.webp', '/assets/images/mock/cover/cover-5.webp', null, 4.8, '3.9 сая', 66, 10, true, 4),
  ('gereet-gerlelt', 'Гэрээт гэрлэлт', 'Нэг жилийн гэрээ, хоёр зөрүүд хүн, нэг дээвэр. Хэн нь түрүүлж дурлах вэ? Инээдтэй, халуун дулаан хайрын түүх.', array['Романс', 'Инээдэм']::text[], '/assets/images/mock/portrait/portrait-6.webp', '/assets/images/mock/cover/cover-6.webp', null, 4.6, '1.9 сая', 48, 10, true, 5),
  ('nuuts-darga', 'Нууц дарга', 'Шинэ ажилтан Тэмүүлэн өөрийгөө байнга зовоодог хамт олны залуу нь үнэндээ компанийн эзэн гэдгийг мэдэхгүй байлаа.', array['Романс', 'Инээдэм']::text[], '/assets/images/mock/portrait/portrait-7.webp', '/assets/images/mock/cover/cover-7.webp', null, 4.7, '2.2 сая', 50, 10, true, 6),
  ('shuniin-murduguch', 'Шөнийн мөрдөгч', 'Улаанбаатарын шөнийн гудамжинд учир битүүлэг хэрэг дараалан гарна. Залуу мөрдөгч Билгүүн цорын ганц сэжүүрийг мөрдөж эхэлнэ.', array['Триллер']::text[], '/assets/images/mock/portrait/portrait-8.webp', '/assets/images/mock/cover/cover-8.webp', 'Шинэ', 4.6, '1.4 сая', 40, 10, true, 7),
  ('martagdsan-okhin', 'Мартагдсан охин', 'Төрөхдөө солигдсон охин хорин жилийн дараа жинхэнэ гэр бүлээ олно. Гэвч түүний оронд өссөн охин байраа амархан тавьж өгөхгүй.', array['Гэр бүл', 'Өшөө авалт']::text[], '/assets/images/mock/cover/cover-9.webp', '/assets/images/mock/cover/cover-9.webp', null, 4.8, '2.5 сая', 58, 10, true, 8),
  ('taliin-zurkh', 'Талын зүрх', 'Хотын амжилттай архитектор эмээгийнхээ хөдөөх гэрт зун өнгөрүүлэхээр очиж, тэнд нэгэн малчин залуутай танилцана.', array['Романс', 'Гэр бүл']::text[], '/assets/images/mock/cover/cover-10.webp', '/assets/images/mock/cover/cover-10.webp', null, 4.7, '1.7 сая', 45, 10, true, 9),
  ('khuurmach-suit-busgui', 'Хуурамч сүйт бүсгүй', 'Ээжийнхээ шахалтаас мултрахын тулд Мишээл танихгүй залууг сүйт залуугийн дүрд тоглуулахаар хөлсөлнө. Төлөвлөгөө бүрэн замбараагүй болно.', array['Инээдэм', 'Романс']::text[], '/assets/images/mock/cover/cover-11.webp', '/assets/images/mock/cover/cover-11.webp', null, 4.5, '1.2 сая', 42, 10, true, 10),
  ('munkhiin-khair', 'Мөнхийн хайр', 'Зуун жилийн турш дахин дахин төрж, бие биенээ хайх хоёр сүнс. Энэ амьдралд тэд эцэст нь хамт байж чадах уу?', array['Романс', 'Уран зөгнөл']::text[], '/assets/images/mock/cover/cover-12.webp', '/assets/images/mock/cover/cover-12.webp', 'Топ', 4.8, '3.4 сая', 64, 10, true, 11)
on conflict (id) do nothing;

-- ============================================================
-- ӨӨРИЙГӨӨ АДМИН БОЛГОХ:
-- Сайт дээр бүртгүүлсний дараа доорх мөрний имэйлийг өөрийнхөөрөө
-- сольж, тусад нь ажиллуулна.
--
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'таны@имэйл.com';
-- ============================================================
