import { createClient } from '@supabase/supabase-js';

import { signBunnyUrl } from 'src/lib/bunny-sign';

// ----------------------------------------------------------------------
// POST /api/kino/stream  { seriesId, ep }
// Толгойд (заавал биш): Authorization: Bearer <Supabase хэрэглэгчийн токен>
//
// Үзэх эрхтэй эсэхийг сервер шалгаад, богино хугацаатай гарын үсэгтэй видео
// холбоос буцаана. Видеоны жинхэнэ холбоос өгөгдлийн сангаас хэзээ ч шууд
// хөтөч рүү явахгүй.
// ----------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FULL_TTL = 6 * 60 * 60; // бүтэн эрхтэй: 6 цаг
const PREVIEW_EXTRA = 15 * 60; // урьдчилан үзэх: үнэгүй хугацаа + 15 минут

let db = null;
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!db) db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return db;
}

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store, private' } });

export async function POST(request) {
  const d = admin();
  if (!d) return json({ error: 'not configured' }, 503);

  let seriesId;
  let ep;
  try {
    ({ seriesId, ep } = await request.json());
  } catch {
    return json({ error: 'bad request' }, 400);
  }
  ep = Number(ep);
  if (!seriesId || !Number.isInteger(ep) || ep < 1) return json({ error: 'bad request' }, 400);

  const { data: series } = await d
    .from('series')
    .select('id, published, episodes, free_episodes, free_minutes')
    .eq('id', seriesId)
    .maybeSingle();
  if (!series || !series.published || ep > series.episodes) return json({ error: 'not found' }, 404);

  const { data: row } = await d.from('episodes').select('video_url').eq('series_id', seriesId).eq('ep', ep).maybeSingle();
  if (!row?.video_url) return json({ url: null }); // видео оруулаагүй анги

  // Хэрэглэгч багцтай эсэх
  let subscribed = false;
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (token) {
    const { data: userData } = await d.auth.getUser(token);
    const uid = userData?.user?.id;
    if (uid) {
      const { data: sub } = await d
        .from('subscriptions')
        .select('status, expires_at')
        .eq('user_id', uid)
        .maybeSingle();
      subscribed = !!sub && sub.status === 'active' && new Date(sub.expires_at) > new Date();
    }
  }

  const freeEpisode = ep <= series.free_episodes;
  const previewSeconds = Math.max(0, series.free_minutes || 0) * 60;

  if (subscribed || freeEpisode) {
    const s = signBunnyUrl(row.video_url, FULL_TTL);
    return json({ url: s.url, mode: 'full', expires: s.expires });
  }

  if (previewSeconds > 0) {
    const s = signBunnyUrl(row.video_url, previewSeconds + PREVIEW_EXTRA);
    return json({ url: s.url, mode: 'preview', previewSeconds, expires: s.expires });
  }

  return json({ error: 'subscription required', mode: 'locked' }, 403);
}
