import { SignJWT, jwtVerify } from 'jose';

import { db, HttpError, errorResponse } from '../admin/_lib';

// ----------------------------------------------------------------------
// Утасны дугаараар нэвтрэх (Verify.MN — хэрэглэгч өөрөө 144773 руу код илгээнэ)
//   POST { action: 'start', phone }  → verify.mn сесс үүсгэж, гарын үсэгтэй "тасалбар" буцаана
//   POST { action: 'check', ticket } → баталгаажсан бол Supabase-ийн нэг удаагийн нэвтрэх токен
// Түлхүүр: VERIFY_MN_API_KEY (зөвхөн сервер дээр), JWT_SECRET (тасалбарт гарын үсэг зурах)
// ----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const API = 'https://api.verify.mn';
// Утасны хэрэглэгчийн дотоод имэйл (хэрэглэгчид харагдахгүй)
const PHONE_EMAIL_DOMAIN = 'phone.444ulaanbaatar.com';

const secretKey = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new HttpError(500, 'JWT_SECRET тохируулаагүй байна.');
  return new TextEncoder().encode(s);
};

const apiKey = () => {
  const k = process.env.VERIFY_MN_API_KEY;
  if (!k) throw new HttpError(503, 'Утсаар нэвтрэх одоогоор идэвхжээгүй байна.');
  return k;
};

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
  const p = String(phone || '')
    .replace(/\D/g, '')
    .replace(/^976(?=\d{8}$)/, '');
  if (!/^[5-9]\d{7}$/.test(p))
    throw new HttpError(400, 'Утасны дугаараа зөв оруулна уу (8 оронтой).');

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
    .setExpirationTime('10m')
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

// Утасны дугаартай хэрэглэгчийг олох эсвэл үүсгэх → нэг удаагийн нэвтрэх токен
async function loginToken(phone) {
  const email = `p${phone}@${PHONE_EMAIL_DOMAIN}`;
  const auth = db().auth.admin;
  const created = await auth.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: phone, phone, login: 'phone' },
  });
  if (created.error && !/already|exists|registered/i.test(created.error.message)) {
    throw new HttpError(500, created.error.message);
  }
  const link = await auth.generateLink({ type: 'magiclink', email });
  const hash = link.data?.properties?.hashed_token;
  if (link.error || !hash)
    throw new HttpError(500, link.error?.message || 'Нэвтрэх токен үүссэнгүй');
  return hash;
}

async function check(ticket) {
  let payload;
  try {
    ({ payload } = await jwtVerify(String(ticket || ''), secretKey()));
  } catch {
    return { status: 'EXPIRED' };
  }
  if (payload.typ !== 'phone-login' || !payload.sid) return { status: 'EXPIRED' };

  const s = await verifyApi(`/sessions/${encodeURIComponent(payload.sid)}`);
  const status = s.sessionStatus || s.status || 'PENDING';
  if (status !== 'VERIFIED') return { status };
  return { status, tokenHash: await loginToken(payload.phone) };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'start') return Response.json(await start(request, body.phone));
    if (body.action === 'check') return Response.json(await check(body.ticket));
    throw new HttpError(400, 'Буруу хүсэлт');
  } catch (err) {
    return errorResponse(err);
  }
}
