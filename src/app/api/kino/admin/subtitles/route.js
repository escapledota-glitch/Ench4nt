import { toVtt, SUB_LANGS, subtitlePath, looksLikeSubtitles } from 'src/lib/subtitles';

import { db, HttpError, requireAdmin, errorResponse } from '../_lib';

// ----------------------------------------------------------------------
// POST /api/kino/admin/subtitles  (multipart: seriesId, ep, lang, file)
// .srt эсвэл .vtt файлыг WebVTT болгож Supabase Storage-д хадгална.
// ----------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX = 2 * 1024 * 1024;

export async function POST(request) {
  try {
    await requireAdmin(request);
    const form = await request.formData();
    const seriesId = String(form.get('seriesId') || '');
    const ep = Number(form.get('ep'));
    const lang = String(form.get('lang') || 'mn');
    const file = form.get('file');

    if (!/^[a-z0-9-]+$/.test(seriesId) || !Number.isInteger(ep) || ep < 1) throw new HttpError(400, 'Буруу хүсэлт');
    if (!SUB_LANGS[lang]) throw new HttpError(400, 'Хэл буруу');
    if (!file || typeof file === 'string') throw new HttpError(400, 'Файл алга');
    if (file.size > MAX) throw new HttpError(400, 'Хадмал 2MB-аас бага байх ёстой');
    if (!/\.(srt|vtt)$/i.test(file.name || '')) throw new HttpError(400, 'Зөвхөн .srt эсвэл .vtt файл оруулна уу');

    const vtt = toVtt(new TextDecoder('utf-8').decode(await file.arrayBuffer()));
    if (!looksLikeSubtitles(vtt)) throw new HttpError(400, 'Хадмалын цаг олдсонгүй. Файлаа шалгана уу.');

    const path = subtitlePath(seriesId, ep, lang);
    const storage = db().storage.from('kino');
    const { error } = await storage.upload(path, Buffer.from(vtt, 'utf-8'), {
      contentType: 'text/vtt; charset=utf-8',
      cacheControl: '60',
      upsert: true,
    });
    if (error) throw new HttpError(500, error.message);

    return Response.json({ ok: true, lang, url: storage.getPublicUrl(path).data.publicUrl });
  } catch (err) {
    return errorResponse(err);
  }
}
