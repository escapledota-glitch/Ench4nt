import { SignJWT, jwtVerify } from 'jose';
import { createHash, scryptSync, randomBytes, timingSafeEqual } from 'crypto';

import { db, HttpError, errorResponse } from '../admin/_lib';

// ----------------------------------------------------------------------
// Утасны дугаараар нэвтрэх
//  1) Анх: Verify.MN — хэрэглэгч өөрөө 144773 руу код илгээж баталгаажуулна,
//     дараа нь 4 оронтой PIN сонгоно.
//  2) Дараа нь: утасны дугаар + PIN (SMS шаардлагагүй).
//
//   POST { action: 'lookup', phone }            → { hasPin }
//   POST { action: 'start', phone }             → verify.mn сесс + гарын үсэгтэй "тасалбар"
//   POST { action: 'check', ticket, resetPin }  → баталгаажсан бол: PIN хэрэгтэй эсэх эсвэл нэвтрэх токен
//   POST { action: 'setPin', ticket, pin }      → PIN хадгалаад нэвтрэх токен
//   POST { action: 'pin', phone, pin }          → PIN зөв бол нэвтрэх токен
//
// PIN-ийн hash нь Supabase Auth-ийн app_metadata-д (зөвхөн сервер бичнэ, хэрэглэгч өөрчлөхгүй).
// 5 удаа буруу оруулбал 15 минут түгжинэ.
// Түлхүүр: VERIFY_MN_API_KEY, JWT_SECRET, SUPABASE_SECRET_KEY (бүгд зөвхөн сервер дээр)
// ----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const API = 'https://api.verify.mn';
// Утасны хэрэглэгчийн дотоод имэйл (хэрэглэгчид харагдахгүй)
const PHONE_EMAIL_DOMAIN = 'phone.444ulaanbaatar.com';
const MAX_FAILS = 5;
const LOCK_MIN = 15;

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new HttpError(500, 'JWT_SECRET тохируулаагүй байна.');
  return s;
};
const secretKey = () => new TextEncoder().encode(secret());

const apiKey = () => {
  const k = process.env.VERIFY_MN_API_KEY;
  if (!k) throw new HttpError(503, 'Утсаар нэвтрэх одоогоор идэвхжээгүй байна.');
  return k;
};

const cleanPhone = (phone) => {
  const p = String(phone || '')
    .replace(/\D/g, '')
    .replace(/^976(?=\d{8}$)/, '');
  if (!/^[5-9]\d{7}$/.test(p))
    throw new HttpError(400, 'Утасны дугаараа зөв оруулна уу (8 оронтой).');
  return p;
};

const emailOf = (phone) => `p${phone}@${PHONE_EMAIL_DOMAIN}`;

// Утасны дугаараас тогтмол UUID (v5) — хэрэглэгчийг хайлтгүйгээр шууд олно
function phoneUserId(phone) {
  const h = createHash('sha1').update(`444kino-phone:${phone}`).digest();
  h[6] = (h[6] % 16) + 0x50;
  h[8] = (h[8] % 64) + 0x80;
  const x = h.subarray(0, 16).toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

// ---------- PIN ----------
const weakPin = (pin) =>
  /^(\d)\1{3}$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin);

function hashPin(pin) {
  const salt = randomBytes(16).toString('hex');
  const h = scryptSync(`${pin}:${secret()}`, salt, 32).toString('hex');
  return `${salt}:${h}`;
}

function pinMatches(pin, stored) {
  const [salt, h] = String(stored || '').split(':');
  if (!salt || !h) return false;
  const a = Buffer.from(h, 'hex');
  const b = scryptSync(`${pin}:${secret()}`, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------- Хэрэглэгч ----------
// Утасны хэрэглэгчийг олно (шинэ хэлбэр: тогтмол id; хуучин: имэйлээр хайна)
async function findUser(phone) {
  const auth = db().auth.admin;
  const byId = await auth.getUserById(phoneUserId(phone));
  if (byId.data?.user) return byId.data.user;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(
    `${url}/auth/v1/admin/users?filter=${encodeURIComponent(emailOf(phone))}&per_page=5`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    }
  );
  const body = await res.json().catch(() => ({}));
  return (body.users || []).find((u) => u.email === emailOf(phone)) || null;
}

async function findOrCreateUser(phone) {
  const existing = await findUser(phone);
  if (existing) return existing;
  const created = await db().auth.admin.createUser({
    id: phoneUserId(phone),
    email: emailOf(phone),
    email_confirm: true,
    user_metadata: { full_name: phone, phone, login: 'phone' },
  });
  if (created.error) throw new HttpError(500, created.error.message);
  return created.data.user;
}

const setAppMeta = async (user, patch) => {
  const { error } = await db().auth.admin.updateUserById(user.id, {
    app_metadata: { ...(user.app_metadata || {}), ...patch },
  });
  if (error) throw new HttpError(500, error.message);
};

// Supabase-ийн нэг удаагийн нэвтрэх токен (хөтөч verifyOtp-оор session болгоно)
async function loginToken(user) {
  const link = await db().auth.admin.generateLink({ type: 'magiclink', email: user.email });
  const hash = link.data?.properties?.hashed_token;
  if (link.error || !hash)
    throw new HttpError(500, link.error?.message || 'Нэвтрэх токен үүссэнгүй');
  return hash;
}

// ---------- Verify.MN ----------
async function verifyApi(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('verify.mn', res.status, body);
    throw new HttpError(502, 'Баталгаажуулах үйлчилгээтэй холбогдож чадсангүй. Дахин оролдоно уу.');
  }
  return body;
}

async function start(request, phone) {
  const p = cleanPhone(phone);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const origin = new URL(request.url).origin;
  const s = await verifyApi('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      phone: p,
      text: code,
      callback: `${origin}/api/kino/phone/callback/`,
      responseSms: '444 Kino: Amjilttai batalgaajlaa. Tavtai moril!',
    }),
  });
  if (!s.sessionId) throw new HttpError(502, 'Баталгаажуулах сесс үүссэнгүй. Дахин оролдоно уу.');

  const ticket = await new SignJWT({ sid: s.sessionId, phone: p, typ: 'phone-login' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secretKey());

  return {
    ticket,
    phone: p,
    shortcode: s.shortcode || '144773',
    text: s.text || code,
    instruction: s.displayInstruction || '',
    expiresAt: s.expiresAt || null,
  };
}

// Тасалбар хүчинтэй бөгөөд verify.mn дээр баталгаажсан эсэх → утасны дугаар (эсвэл статус)
async function verifiedPhone(ticket) {
  let payload;
  try {
    ({ payload } = await jwtVerify(String(ticket || ''), secretKey()));
  } catch {
    return { status: 'EXPIRED' };
  }
  if (payload.typ !== 'phone-login' || !payload.sid) return { status: 'EXPIRED' };
  const s = await verifyApi(`/sessions/${encodeURIComponent(payload.sid)}`);
  const status = s.sessionStatus || s.status || 'PENDING';
  return status === 'VERIFIED' ? { status, phone: payload.phone } : { status };
}

async function check(ticket, resetPin) {
  const v = await verifiedPhone(ticket);
  if (!v.phone) return { status: v.status };
  const user = await findOrCreateUser(v.phone);
  // PIN байхгүй (анх удаа) эсвэл "PIN мартсан" бол эхлээд PIN сонгуулна
  if (!user.app_metadata?.pin_hash || resetPin) return { status: v.status, needsPin: true };
  return { status: v.status, tokenHash: await loginToken(user) };
}

async function setPin(ticket, pin) {
  const p = String(pin || '');
  if (!/^\d{4}$/.test(p)) throw new HttpError(400, 'PIN код 4 оронтой тоо байна.');
  if (weakPin(p))
    throw new HttpError(400, 'Хэт амархан PIN байна (1111, 1234 гэх мэт). Өөр код сонгоно уу.');
  const v = await verifiedPhone(ticket);
  if (!v.phone) throw new HttpError(400, 'Баталгаажуулалтын хугацаа дууссан. Дахин эхлүүлнэ үү.');
  const user = await findOrCreateUser(v.phone);
  await setAppMeta(user, { pin_hash: hashPin(p), pin_fails: 0, pin_locked_until: null });
  return { tokenHash: await loginToken(user) };
}

async function lookup(phone) {
  const user = await findUser(cleanPhone(phone));
  return { hasPin: !!user?.app_metadata?.pin_hash };
}

async function pinLogin(phone, pin) {
  const p = cleanPhone(phone);
  const user = await findUser(p);
  const meta = user?.app_metadata || {};
  if (!user || !meta.pin_hash) throw new HttpError(400, 'Энэ дугаарт PIN код тохируулаагүй байна.');

  const lockedUntil = meta.pin_locked_until ? new Date(meta.pin_locked_until) : null;
  if (lockedUntil && lockedUntil > new Date()) {
    const mins = Math.ceil((lockedUntil - Date.now()) / 60000);
    throw new HttpError(
      429,
      `Олон удаа буруу оруулсан тул ${mins} минутын дараа дахин оролдоно уу. Эсвэл "PIN мартсан" дарж SMS-ээр нэвтэрнэ үү.`
    );
  }

  if (!pinMatches(String(pin || ''), meta.pin_hash)) {
    const fails = (Number(meta.pin_fails) || 0) + 1;
    const lock = fails >= MAX_FAILS;
    await setAppMeta(user, {
      pin_fails: lock ? 0 : fails,
      pin_locked_until: lock ? new Date(Date.now() + LOCK_MIN * 60000).toISOString() : null,
    });
    if (lock)
      throw new HttpError(
        429,
        `${MAX_FAILS} удаа буруу оруулсан тул ${LOCK_MIN} минут түгжигдлээ. "PIN мартсан" дарж SMS-ээр нэвтэрч болно.`
      );
    throw new HttpError(401, `PIN код буруу байна. (${MAX_FAILS - fails} оролдлого үлдлээ)`);
  }

  if (meta.pin_fails || meta.pin_locked_until)
    await setAppMeta(user, { pin_fails: 0, pin_locked_until: null });
  return { tokenHash: await loginToken(user) };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    switch (body.action) {
      case 'lookup':
        return Response.json(await lookup(body.phone));
      case 'start':
        return Response.json(await start(request, body.phone));
      case 'check':
        return Response.json(await check(body.ticket, !!body.resetPin));
      case 'setPin':
        return Response.json(await setPin(body.ticket, body.pin));
      case 'pin':
        return Response.json(await pinLogin(body.phone, body.pin));
      default:
        throw new HttpError(400, 'Буруу хүсэлт');
    }
  } catch (err) {
    return errorResponse(err);
  }
}
