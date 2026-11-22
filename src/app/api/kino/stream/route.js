import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

import { signBunnyUrl } from 'src/lib/bunny-sign';
import { SUB_LANGS, subtitlePath, subtitleFolder, readSubtitleStyle } from 'src/lib/subtitles';

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

// Энэ ангийн хадмалууд + админы тохируулсан харагдах байдал (хоёуланг зэрэг уншина)
async function subtitlesFor(d, seriesId, ep) {
  try {
    const storage = d.storage.from('kino');
    const [{ data: files }, style] = await Promise.all([
      storage.list(subtitleFolder(seriesId, ep), { limit: 20 }),
      readSubtitleStyle(d, seriesId),
    ]);
    const subtitles = (files ?? [])
      .map((f) => ({ lang: f.name.replace(/\.vtt$/, ''), v: f.updated_at }))
      .filter((f) => SUB_LANGS[f.lang])
      .sort((a, b) => (a.lang === 'mn' ? -1 : b.lang === 'mn' ? 1 : 0))
      .map((f) => ({
        lang: f.lang,
        label: SUB_LANGS[f.lang],
        url: `${storage.getPublicUrl(subtitlePath(seriesId, ep, f.lang)).data.publicUrl}?v=${encodeURIComponent(f.v || '')}`,
      }));
    // Хадмалгүй ч гэсэн хаалт тууз (mask) ажиллахын тулд тохиргоог үргэлж өгнө
    if (!subtitles.length) return { subtitles: [], subtitleStyle: style };
    return { subtitles, subtitleStyle: style };
  } catch {
    return { subtitles: [] };
  }
}

// Хэрэглэгч багцтай эсвэл энэ киног худалдаж авсан эсэх — хэрэглэгчийн өөрийн
// токеноор (RLS нь зөвхөн өөрийнх нь мөрийг өгнө; токеныг Supabase шалгана). Зэрэг.
async function viewerAccess(token, seriesId) {
  if (!token) return { subscribed: false, owned: false };
  try {
    const userDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [{ data: sub }, { data: bought }] = await Promise.all([
      userDb.from('subscriptions').select('status, expires_at').maybeSingle(),
      userDb.from('purchases').select('series_id').eq('series_id', seriesId).maybeSingle(),
    ]);
    return {
      subscribed: !!sub && sub.status === 'active' && new Date(sub.expires_at) > new Date(),
      owned: !!bought,
    };
  } catch {
    return { subscribed: false, owned: false };
  }
}

// Админы токен (dashboard нэвтрэлт) — "дэлгэц дээр тааруулах" горимд бүтэн үзэх эрх
async function isAdminToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.sub === 'ench4nt-admin';
  } catch {
    return false;
  }
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

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  // Бүх шалгалтыг ЗЭРЭГ хийнэ (дараалан хийвэл сервер ↔ өгөгдлийн сан хооронд
  // олон удаа явж, видео эхлэх нь хэдэн секундээр удааширдаг байсан)
  const [epRes, subs, access, isAdmin] = await Promise.all([
    d
      .from('episodes')
      .select('video_url, series!inner(published, episodes, free_episodes, free_minutes)')
      .eq('series_id', seriesId)
      .eq('ep', ep)
      .maybeSingle(),
    subtitlesFor(d, seriesId, ep),
    viewerAccess(token, seriesId),
    isAdminToken(request.headers.get('x-admin-token')),
  ]);

  const row = epRes.data;
  const series = row?.series;
  if (!row?.video_url || !series) return json({ url: null }); // видео оруулаагүй анги
  if (!series.published || ep > series.episodes) return json({ error: 'not found' }, 404);

  const freeEpisode = ep <= series.free_episodes;
  const previewSeconds = Math.max(0, series.free_minutes || 0) * 60;

  if (isAdmin || access.subscribed || access.owned || freeEpisode) {
    const s = signBunnyUrl(row.video_url, FULL_TTL);
    return json({ url: s.url, mode: 'full', expires: s.expires, ...subs });
  }

  if (previewSeconds > 0) {
    const s = signBunnyUrl(row.video_url, previewSeconds + PREVIEW_EXTRA);
    return json({ url: s.url, mode: 'preview', previewSeconds, expires: s.expires, ...subs });
  }

  return json({ error: 'subscription required', mode: 'locked' }, 403);
}
