import webpush from 'web-push';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------
// POST /api/kino/push  — админ мэдэгдэл илгээнэ.
// Толгойд: Authorization: Bearer <админы нэвтрэлтийн токен>
// Бие: { title, body, url }
// ----------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;

  if (!url || !anon) return NextResponse.json({ error: 'Supabase тохируулаагүй' }, { status: 500 });

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Нэвтрээгүй' }, { status: 401 });

  // Хэрэглэгчийн өөрийн эрхээр ажиллана — RLS болон is_admin() шалгалт хүчинтэй
  const db = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: isAdmin } = await db.rpc('is_admin');
  if (!isAdmin) return NextResponse.json({ error: 'Эрх хүрэхгүй' }, { status: 403 });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Буруу хүсэлт' }, { status: 400 });
  }

  const title = String(payload.title ?? '').trim().slice(0, 120);
  const body = String(payload.body ?? '').trim().slice(0, 400);
  const link = payload.url && String(payload.url).startsWith('/') ? String(payload.url).slice(0, 300) : null;
  if (!title) return NextResponse.json({ error: 'Гарчиг хоосон байна' }, { status: 400 });

  // 1. Сайт доторх мэдэгдлийн жагсаалтад хадгална
  const { error: insertError } = await db.from('notifications').insert({ title, body, url: link });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // 2. Утас руу push илгээнэ
  if (!pub || !priv) return NextResponse.json({ saved: true, sent: 0, failed: 0, note: 'VAPID түлхүүр алга' });

  webpush.setVapidDetails(process.env.VAPID_CONTACT || 'mailto:admin@example.com', pub, priv);

  const { data: subs, error: subsError } = await db.rpc('admin_push_subscriptions');
  if (subsError) return NextResponse.json({ error: subsError.message }, { status: 500 });

  const message = JSON.stringify({ title, body, url: link ?? '/drama/' });
  const results = await Promise.allSettled(
    (subs ?? []).map((s) => webpush.sendNotification(s.subscription, message, { TTL: 60 * 60 * 24 }))
  );

  const expired = [];
  let sent = 0;
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') sent += 1;
    else if ([404, 410].includes(r.reason?.statusCode)) expired.push(subs[i].endpoint);
  });
  if (expired.length) await db.rpc('admin_delete_push', { p_endpoints: expired });

  return NextResponse.json({ saved: true, sent, failed: results.length - sent, removed: expired.length });
}
