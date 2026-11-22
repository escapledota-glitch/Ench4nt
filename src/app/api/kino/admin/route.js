import webpush from 'web-push';

import { signBunnyUrl } from 'src/lib/bunny-sign';
import {
  SUB_LANGS,
  subtitlePath,
  subtitleStylePath,
  readSubtitleStyle,
  normalizeSubtitleStyle,
} from 'src/lib/subtitles';

import { MONTHLY_VALUE as MONTHLY } from 'src/sections/drama/drama-data';

import { db, must, HttpError, requireAdmin, errorResponse } from './_lib';

// ----------------------------------------------------------------------
// POST /api/kino/admin   { action, ...params }
// Бүх админ үйлдэл энд — эхлээд админ нэвтрэлтийг шалгана.
// ----------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLAN_DAYS = { week: 7, month: 30, year: 365 };

const ACTIONS = {
  // ---------- Ерөнхий ----------
  async stats() {
    const d = db();
    const now = new Date().toISOString();
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

    const users = await listAllUsers();
    const active = must(await d.from('subscriptions').select('plan').eq('status', 'active').gt('expires_at', now));
    const byPlan = active.reduce((acc, r) => ({ ...acc, [r.plan]: (acc[r.plan] ?? 0) + 1 }), {});
    const { count: series } = await d.from('series').select('id', { count: 'exact', head: true });
    const { count: push } = await d.from('push_subscriptions').select('endpoint', { count: 'exact', head: true });
    const watching = must(await d.from('watch_history').select('user_id').gt('updated_at', weekAgo));
    const sales = must(await d.from('purchases').select('price, created_at'));

    return {
      purchases: sales.length,
      purchases_revenue: sales.reduce((s, r) => s + (r.price || 0), 0),
      purchases_7d: sales.filter((r) => r.created_at > weekAgo).length,
      users: users.length,
      users_7d: users.filter((u) => u.created_at > weekAgo).length,
      active: active.length,
      by_plan: byPlan,
      mrr: Object.entries(byPlan).reduce((s, [p, n]) => s + (MONTHLY[p] ?? 0) * n, 0),
      series: series ?? 0,
      push: push ?? 0,
      watching_7d: new Set(watching.map((w) => w.user_id)).size,
    };
  },

  // ---------- Цуврал ----------
  listSeries: async () =>
    must(await db().from('series').select('*').order('sort').order('created_at', { ascending: false })),

  getSeries: async ({ id }) => must(await db().from('series').select('*').eq('id', id).maybeSingle()),

  async saveSeries({ row, originalId }) {
    const d = db();
    if (originalId && originalId !== row.id) {
      must(await d.from('series').insert(row));
      must(await d.from('episodes').update({ series_id: row.id }).eq('series_id', originalId));
      must(await d.from('series').delete().eq('id', originalId));
      return row;
    }
    return must(await d.from('series').upsert(row).select().single());
  },

  setPublished: async ({ id, published }) => must(await db().from('series').update({ published }).eq('id', id)),

  deleteSeries: async ({ id }) => must(await db().from('series').delete().eq('id', id)),

  // ---------- Анги ----------
  listEpisodes: async ({ seriesId }) =>
    must(await db().from('episodes').select('ep, video_url').eq('series_id', seriesId).order('ep')),

  async saveEpisodes({ seriesId, videos }) {
    const d = db();
    const rows = [];
    const empty = [];
    Object.entries(videos ?? {}).forEach(([ep, url]) => {
      if (String(url ?? '').trim()) rows.push({ series_id: seriesId, ep: Number(ep), video_url: String(url).trim() });
      else empty.push(Number(ep));
    });
    if (rows.length) must(await d.from('episodes').upsert(rows));
    if (empty.length) must(await d.from('episodes').delete().eq('series_id', seriesId).in('ep', empty));
    return { saved: rows.length };
  },

  // Админ нэвтэрсэн эсэхийг шалгах (дэлгэц дээр тааруулах горимд)
  ping: async () => ({ ok: true }),

  // ---------- Хадмал (зөвхөн админ тохируулна) ----------
  // { [ep]: ['mn', 'en'] }
  async listSubtitles({ seriesId }) {
    const storage = db().storage.from('kino');
    const { data: folders } = await storage.list(`subtitles/${seriesId}`, { limit: 1000 });
    const out = {};
    await Promise.all(
      (folders ?? [])
        .filter((f) => /^\d+$/.test(f.name))
        .map(async (f) => {
          const { data: files } = await storage.list(`subtitles/${seriesId}/${f.name}`, { limit: 50 });
          const langs = (files ?? []).map((x) => x.name.replace(/\.vtt$/, '')).filter((l) => SUB_LANGS[l]);
          if (langs.length) out[f.name] = langs;
        })
    );
    return out;
  },

  async deleteSubtitle({ seriesId, ep, lang }) {
    if (!SUB_LANGS[lang]) throw new HttpError(400, 'Хэл буруу');
    const { error } = await db().storage.from('kino').remove([subtitlePath(seriesId, Number(ep), lang)]);
    if (error) throw new HttpError(500, error.message);
    return { ok: true };
  },

  getSubtitleStyle: async ({ seriesId }) => readSubtitleStyle(db(), seriesId),

  // Хадмал/туузыг тааруулах урьдчилан харахад: эхний видеотой ангийн гарын үсэгтэй холбоос
  async previewVideo({ seriesId }) {
    const rows = must(await db().from('episodes').select('ep, video_url').eq('series_id', seriesId).order('ep').limit(1));
    if (!rows?.length) return null;
    return { ep: rows[0].ep, url: signBunnyUrl(rows[0].video_url, 3 * 60 * 60).url };
  },

  async saveSubtitleStyle({ seriesId, style }) {
    const clean = normalizeSubtitleStyle(style);
    const { error } = await db()
      .storage.from('kino')
      .upload(subtitleStylePath(seriesId), Buffer.from(JSON.stringify(clean)), {
        contentType: 'application/json',
        cacheControl: '60',
        upsert: true,
      });
    if (error) throw new HttpError(500, error.message);
    return clean;
  },

  // ---------- Хэрэглэгч ----------
  async listUsers() {
    const d = db();
    const users = await listAllUsers();
    const subs = must(await d.from('subscriptions').select('*'));
    const admins = must(await d.from('admins').select('user_id'));
    const subBy = Object.fromEntries(subs.map((s) => [s.user_id, s]));
    const adminSet = new Set(admins.map((a) => a.user_id));
    return users
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        plan: subBy[u.id]?.plan ?? null,
        expires_at: subBy[u.id]?.expires_at ?? null,
        is_admin: adminSet.has(u.id),
      }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },

  async grantPlan({ userId, plan }) {
    const days = PLAN_DAYS[plan];
    if (!days) throw new HttpError(400, 'Буруу багц');
    const d = db();
    const current = must(await d.from('subscriptions').select('expires_at').eq('user_id', userId).maybeSingle());
    const base = Math.max(Date.now(), current?.expires_at ? new Date(current.expires_at).getTime() : 0);
    const expires = new Date(base);
    if (plan === 'month') expires.setMonth(expires.getMonth() + 1);
    else if (plan === 'year') expires.setFullYear(expires.getFullYear() + 1);
    else expires.setDate(expires.getDate() + days);
    must(
      await d.from('subscriptions').upsert({
        user_id: userId,
        plan,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expires.toISOString(),
      })
    );
    return { expires_at: expires.toISOString() };
  },

  cancelPlan: async ({ userId }) =>
    must(
      await db()
        .from('subscriptions')
        .update({ status: 'cancelled', expires_at: new Date().toISOString() })
        .eq('user_id', userId)
    ),

  // ---------- Мэдэгдэл ----------
  listNotifications: async () =>
    must(await db().from('notifications').select('*').order('created_at', { ascending: false }).limit(100)),

  deleteNotification: async ({ id }) => must(await db().from('notifications').delete().eq('id', id)),

  async sendNotification({ title, body, url }) {
    const d = db();
    const t = String(title ?? '').trim().slice(0, 120);
    const b = String(body ?? '').trim().slice(0, 400);
    const link = url && String(url).startsWith('/') ? String(url).slice(0, 300) : null;
    if (!t) throw new HttpError(400, 'Гарчиг хоосон байна');

    must(await d.from('notifications').insert({ title: t, body: b, url: link }));

    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) return { sent: 0, failed: 0 };

    webpush.setVapidDetails(process.env.VAPID_CONTACT || 'mailto:admin@example.com', pub, priv);
    const subs = must(await d.from('push_subscriptions').select('endpoint, subscription'));
    const message = JSON.stringify({ title: t, body: b, url: link ?? '/drama/' });
    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification(s.subscription, message, { TTL: 86400 }))
    );

    const expired = [];
    let sent = 0;
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') sent += 1;
      else if ([404, 410].includes(r.reason?.statusCode)) expired.push(subs[i].endpoint);
    });
    if (expired.length) await d.from('push_subscriptions').delete().in('endpoint', expired);
    return { sent, failed: results.length - sent };
  },
};

async function listAllUsers() {
  const all = [];
  for (let page = 1; page < 50; page += 1) {
    const { data, error } = await db().auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new HttpError(500, error.message);
    all.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return all;
}

export async function POST(request) {
  try {
    await requireAdmin(request);
    const { action, ...params } = await request.json();
    const fn = ACTIONS[action];
    if (!fn) throw new HttpError(400, `Unknown action: ${action}`);
    return Response.json({ data: (await fn(params)) ?? null });
  } catch (err) {
    return errorResponse(err);
  }
}
