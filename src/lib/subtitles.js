// ----------------------------------------------------------------------
// Хадмал (subtitle) — SRT → WebVTT хөрвүүлэлт ба хадгалах зам.
// Файл: Supabase Storage "kino" сан → subtitles/<seriesId>/<ep>/<lang>.vtt
// ----------------------------------------------------------------------

export const SUB_LANGS = {
  mn: 'Монгол',
  en: 'English',
  ko: '한국어',
  zh: '中文',
  ru: 'Русский',
  ja: '日本語',
};

export const subtitlePath = (seriesId, ep, lang) => `subtitles/${seriesId}/${ep}/${lang}.vtt`;
export const subtitleFolder = (seriesId, ep) => `subtitles/${seriesId}/${ep}`;

// SRT эсвэл VTT текстийг цэвэр WebVTT болгоно
export function toVtt(raw) {
  let text = String(raw ?? '')
    .replace(/\r\n?/g, '\n')
    .trim();

  if (/^WEBVTT/.test(text)) return `${text}\n`;

  // SRT: "00:00:01,500 --> 00:00:03,000" → "00:00:01.500 --> 00:00:03.000"
  text = text.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{1,3})/g, '$1.$2');
  // Блок бүрийн эхний дугаарыг хасна
  text = text
    .split(/\n{2,}/)
    .map((block) => block.replace(/^\d+\s*\n(?=[\d:.]+\s*-->)/, ''))
    .join('\n\n');

  return `WEBVTT\n\n${text}\n`;
}

// Хадмал мөн эсэхийг энгийнээр шалгах
export const looksLikeSubtitles = (vtt) => /-->/.test(vtt);

// ----------------------------------------------------------------------
// Хадмалын харагдах байдал — зөвхөн админ тохируулна (цуврал бүрт нэг).
//   x, y   — дэлгэц дээрх байрлал (%) : x = хэвтээ төв, y = босоо төв
//   size   — үсгийн хэмжээ (390px өргөн дэлгэц дээрх px; бусад дэлгэцэнд пропорциональ)
//   color  — үсгийн өнгө
//   bg     — 'none' | 'shadow' | 'box'
//   bold   — тод эсэх
//   delay  — хугацааны тохиргоо (сек): + бол хожуу, − бол эрт
//   width  — нэг мөрийн дээд өргөн (%)
// ----------------------------------------------------------------------

export const DEFAULT_SUB_STYLE = { x: 50, y: 82, size: 18, color: '#ffffff', bg: 'shadow', bold: true, delay: 0, width: 86 };

const clamp = (v, min, max, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};

export function normalizeSubtitleStyle(s = {}) {
  const d = DEFAULT_SUB_STYLE;
  return {
    x: clamp(s.x, 0, 100, d.x),
    y: clamp(s.y, 0, 100, d.y),
    size: clamp(s.size, 10, 48, d.size),
    color: /^#[0-9a-f]{6}$/i.test(s.color ?? '') ? s.color : d.color,
    bg: ['none', 'shadow', 'box'].includes(s.bg) ? s.bg : d.bg,
    bold: typeof s.bold === 'boolean' ? s.bold : d.bold,
    delay: Math.round(clamp(s.delay, -30, 30, d.delay) * 10) / 10,
    width: clamp(s.width, 40, 100, d.width),
  };
}

export const subtitleStylePath = (seriesId) => `subtitles/${seriesId}/style.json`;

// Сервер дээр (service role) — тохиргоо байхгүй бол үндсэн утга
export async function readSubtitleStyle(db, seriesId) {
  const { data } = await db.storage.from('kino').download(subtitleStylePath(seriesId));
  if (!data) return { ...DEFAULT_SUB_STYLE };
  try {
    return normalizeSubtitleStyle(JSON.parse(await data.text()));
  } catch {
    return { ...DEFAULT_SUB_STYLE };
  }
}
