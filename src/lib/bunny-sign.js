import crypto from 'crypto';

// ----------------------------------------------------------------------
// Bunny CDN token authentication (SHA256, directory/"path" token).
// HLS-д тохиромжтой: токен URL-ын замд байрладаг тул playlist доторх
// бүх сегмент (relative URL) автоматаар токентой ачаалагдана.
//
// BUNNY_TOKEN_KEY — Bunny → Stream → (library) → Security / Pull zone →
// Security → Token authentication key. Байхгүй бол URL-ыг өөрчлөхгүй.
// ----------------------------------------------------------------------

const b64url = (buf) => buf.toString('base64').replace(/\n/g, '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

/**
 * @param {string} url        ж: https://vz-xxx.b-cdn.net/<videoId>/playlist.m3u8
 * @param {number} ttlSeconds хэдэн секунд хүчинтэй
 * @returns {{ url: string, expires: number, signed: boolean }}
 */
export function signBunnyUrl(url, ttlSeconds) {
  const key = process.env.BUNNY_TOKEN_KEY;
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { url, expires, signed: false };
  }

  // Зөвхөн Bunny-гийн CDN холбоосыг гарын үсэглэнэ
  if (!key || !/\.b-cdn\.net$/i.test(parsed.hostname)) return { url, expires, signed: false };

  // /<videoId>/playlist.m3u8 → токен /<videoId>/ доторх бүх файлд хүчинтэй
  const parts = parsed.pathname.split('/').filter(Boolean);
  const tokenPath = parts.length > 1 ? `/${parts.slice(0, -1).join('/')}/` : '/';

  const params = { token_path: tokenPath };
  const keys = Object.keys(params).sort();
  const parameterData = keys.map((k) => `${k}=${params[k]}`).join('&');
  const parameterDataUrl = keys.map((k) => `&${k}=${encodeURIComponent(params[k])}`).join('');

  const hashable = key + tokenPath + expires + parameterData;
  const token = b64url(crypto.createHash('sha256').update(hashable).digest());

  const signed = `${parsed.protocol}//${parsed.host}/bcdn_token=${token}${parameterDataUrl}&expires=${expires}${parsed.pathname}`;
  return { url: signed, expires, signed: true };
}
