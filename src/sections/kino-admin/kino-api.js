'use client';

import { JWT_STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------
// 444 Кино — админы үйлдлүүд.
// Dashboard-ын нэвтрэлтийн (Ench4nt) токеноор /api/kino/admin руу хандана.
// Өгөгдлийн сантай зөвхөн сервер ажиллана.
// ----------------------------------------------------------------------

const token = () => {
  try {
    return window.sessionStorage.getItem(JWT_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

async function call(action, params = {}) {
  const res = await fetch('/api/kino/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ action, ...params }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Алдаа гарлаа');
  return json.data;
}

// ---------- Ерөнхий ----------
export const getStats = () => call('stats');

// ---------- Цуврал ----------
export const listSeries = () => call('listSeries');
export const getSeriesRow = (id) => call('getSeries', { id });
export const saveSeries = (row, originalId) => call('saveSeries', { row, originalId });
export const setPublished = (id, published) => call('setPublished', { id, published });
export const setEpisodeCount = (id, episodes, freeEpisodes) => call('setEpisodeCount', { id, episodes, freeEpisodes });
export const deleteSeries = (id) => call('deleteSeries', { id });

// ---------- Анги ----------
export const listEpisodes = (seriesId) => call('listEpisodes', { seriesId });
export const saveEpisodes = (seriesId, videos) => call('saveEpisodes', { seriesId, videos });

// ---------- Зураг байршуулах ----------
export async function uploadImage(file, folder = 'posters') {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  const res = await fetch('/api/kino/admin/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Зураг хадгалж чадсангүй');
  return json.url;
}

// ---------- Хадмал ----------
export const listSubtitles = (seriesId) => call('listSubtitles', { seriesId });
export const deleteSubtitle = (seriesId, ep, lang) => call('deleteSubtitle', { seriesId, ep, lang });
export const getSubtitleStyle = (seriesId) => call('getSubtitleStyle', { seriesId });
export const saveSubtitleStyle = (seriesId, style) => call('saveSubtitleStyle', { seriesId, style });
export const previewVideo = (seriesId) => call('previewVideo', { seriesId });

export async function uploadSubtitle(seriesId, ep, lang, file) {
  const form = new FormData();
  form.append('seriesId', seriesId);
  form.append('ep', String(ep));
  form.append('lang', lang);
  form.append('file', file);
  const res = await fetch('/api/kino/admin/subtitles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Хадмал хадгалж чадсангүй');
  return json;
}

// ---------- Хэрэглэгч ----------
export const listUsers = () => call('listUsers');
export const grantPlan = (userId, plan) => call('grantPlan', { userId, plan });
export const cancelPlan = (userId) => call('cancelPlan', { userId });

// ---------- Мэдэгдэл ----------
export const listNotifications = () => call('listNotifications');
export const deleteNotification = (id) => call('deleteNotification', { id });
export const sendNotification = (payload) => call('sendNotification', payload);

// ---------- Туслах ----------

// Кирилл → латин холбоосны нэр: "Талын зүрх" → "talyn-zurkh"
const MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', ө: 'u', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ү: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function slugify(text) {
  return text
    .toLowerCase()
    .split('')
    .map((c) => MAP[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function errorText(err) {
  const msg = err?.message ?? String(err);
  if (/duplicate key/i.test(msg)) return 'Ийм холбоосны нэртэй цуврал аль хэдийн байна.';
  if (/Bucket not found/i.test(msg)) return 'Зургийн сан (kino bucket) үүсээгүй байна. schema-v2.sql-ийг ажиллуулна уу.';
  if (/relation .* does not exist|Could not find the table|schema cache/i.test(msg))
    return 'Өгөгдлийн сан бэлэн биш. Supabase дээр supabase/schema.sql, schema-v2.sql-ийг ажиллуулна уу.';
  return msg;
}
