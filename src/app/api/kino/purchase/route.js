import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------
// POST /api/kino/purchase  { seriesId }
// Толгойд: Authorization: Bearer <Supabase хэрэглэгчийн токен>
//
// ТУРШИЛТЫН ТӨЛБӨР: мөнгө татахгүйгээр киног хэрэглэгчид нээнэ.
// QPay холбох үед энд нэхэмжлэх үүсгэж, төлбөр баталгаажсаны дараа л
// purchases хүснэгтэд бичнэ.
// ----------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json({ error: 'Сервер тохируулаагүй байна' }, 503);
  const d = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Нэвтэрнэ үү' }, 401);
  const { data: userData } = await d.auth.getUser(token);
  const uid = userData?.user?.id;
  if (!uid) return json({ error: 'Нэвтрэлтийн хугацаа дууссан. Дахин нэвтэрнэ үү.' }, 401);

  let seriesId;
  try {
    ({ seriesId } = await request.json());
  } catch {
    return json({ error: 'Буруу хүсэлт' }, 400);
  }

  const { data: series } = await d.from('series').select('id, title, price, published').eq('id', seriesId).maybeSingle();
  if (!series || !series.published) return json({ error: 'Кино олдсонгүй' }, 404);
  if (!(series.price > 0)) return json({ error: 'Энэ кино тусдаа зарагдахгүй — багцаар үзнэ үү' }, 400);

  const { error } = await d
    .from('purchases')
    .upsert({ user_id: uid, series_id: series.id, price: series.price }, { onConflict: 'user_id,series_id', ignoreDuplicates: true });
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, seriesId: series.id, price: series.price });
}
