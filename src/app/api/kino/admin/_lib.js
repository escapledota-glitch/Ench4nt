import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------
// 444 Кино админ — сервер талын туслах.
// Админ нь хуучин dashboard-ын нэвтрэлтээр (Ench4nt) орно; өгөгдлийн сантай
// зөвхөн сервер дээр SUPABASE_SECRET_KEY-ээр ажиллана (хөтөч рүү хэзээ ч явахгүй).
// ----------------------------------------------------------------------

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function requireAdmin(request) {
  const secret = process.env.JWT_SECRET;
  // Нууц түлхүүргүйгээр (кодонд бичигдсэн анхдагч утгаар) ажиллахыг зөвшөөрөхгүй
  if (!secret) throw new HttpError(500, 'JWT_SECRET тохируулаагүй байна (.env.local).');

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Нэвтрээгүй байна. Дахин нэвтэрнэ үү.');

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.sub !== 'ench4nt-admin') throw new Error('not admin');
    return payload;
  } catch {
    throw new HttpError(401, 'Нэвтрэлтийн хугацаа дууссан. Дахин нэвтэрнэ үү.');
  }
}

let adminDb = null;

export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Хуучин Ench4nt төсөл SUPABASE_SERVICE_ROLE_KEY нэрээр Vercel-д хадгалсан байгаа
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new HttpError(500, 'Supabase URL тохируулаагүй байна.');
  if (!key) {
    throw new HttpError(
      500,
      'Supabase-ийн нууц түлхүүр алга (SUPABASE_SERVICE_ROLE_KEY эсвэл SUPABASE_SECRET_KEY). Supabase → Project Settings → API Keys-ээс хуулж .env.local / Vercel-д оруулна уу.'
    );
  }
  if (!adminDb) {
    adminDb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return adminDb;
}

export const must = ({ data, error }) => {
  if (error) throw new HttpError(500, error.message);
  return data;
};

export function errorResponse(err) {
  const status = err instanceof HttpError ? err.status : 500;
  return Response.json({ error: err.message || 'Алдаа гарлаа' }, { status });
}
