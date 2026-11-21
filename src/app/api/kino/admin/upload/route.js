import { db, HttpError, requireAdmin, errorResponse } from '../_lib';

// ----------------------------------------------------------------------
// POST /api/kino/admin/upload  (multipart: file, folder) → { url }
// Постер, арын зургийг Supabase Storage-ийн "kino" сан руу хадгална.
// ----------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX = 5 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export async function POST(request) {
  try {
    await requireAdmin(request);
    const form = await request.formData();
    const file = form.get('file');
    const folder = String(form.get('folder') || 'posters').replace(/[^a-z0-9-]/gi, '') || 'posters';

    if (!file || typeof file === 'string') throw new HttpError(400, 'Файл алга');
    if (!OK_TYPES.includes(file.type)) throw new HttpError(400, 'Зөвхөн зураг (jpg, png, webp) оруулна уу');
    if (file.size > MAX) throw new HttpError(400, 'Зураг 5MB-аас бага байх ёстой');

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storage = db().storage.from('kino');

    const { error } = await storage.upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: '31536000',
    });
    if (error) throw new HttpError(500, error.message);

    return Response.json({ url: storage.getPublicUrl(path).data.publicUrl });
  } catch (err) {
    return errorResponse(err);
  }
}
