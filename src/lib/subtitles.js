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

// bg: 'box' үед — арын фоны өнгө, тунгалаг байдал (%), бүдгэрүүлэлт (px), дотор зай (em)
// mask: эх видеон дээр шатаагдсан хуучин хадмалыг нуух "хаалт" тууз
// mode:   'band'  = өнгөт/бүдэг тууз бүхэлдээ
//         'smart' = зөвхөн цагаан бичгийг олж, эргэн тойрных нь зургаар бөглөж бүдгэрүүлнэ
// timing: 'always' = үргэлж, 'subs' = манай хадмал гарах үед л (padBefore сек өмнөөс, padAfter сек дараа хүртэл)
// Анхдагч утгууд = "1995" киноны тааруулсан тохиргоо (шинэ кино бүр ингэж эхэлнэ)
export const DEFAULT_SUB_MASK = {
  on: true,
  y: 71,
  h: 26,
  w: 75,
  color: '#000000',
  opacity: 85,
  blur: 12,
  mode: 'smart',
  timing: 'subs',
  padBefore: 1, // манай хадмалаас хэдэн сек өмнө эхлэх
  padAfter: 1, // манай хадмал дууссаны дараа хэдэн сек үргэлжлэх
  threshold: 202,
  strength: 10,
  expand: 4,
  textColor: 'white', // 'white' | 'yellow' | 'bright'
  outline: true, // зөвхөн бараан хүрээтэй (хадмалын) бичиг — цагаан хувцас, гэрэл гэх мэтэд нөлөөлөхгүй
};

export const DEFAULT_SUB_STYLE = {
  x: 51,
  y: 67,
  size: 28,
  color: '#ffffff',
  bg: 'box',
  bold: false,
  delay: 0,
  width: 86,
  bgColor: '#1d1529',
  bgOpacity: 32,
  bgBlur: 2,
  bgPad: 0.6,
  mask: DEFAULT_SUB_MASK,
};

const clamp = (v, min, max, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};
const hex = (v, d) => (/^#[0-9a-f]{6}$/i.test(v ?? '') ? v : d);

export function normalizeSubtitleStyle(s = {}) {
  const d = DEFAULT_SUB_STYLE;
  const m = s.mask || {};
  const dm = DEFAULT_SUB_MASK;
  return {
    x: clamp(s.x, 0, 100, d.x),
    y: clamp(s.y, 0, 100, d.y),
    size: clamp(s.size, 10, 48, d.size),
    color: hex(s.color, d.color),
    bg: ['none', 'shadow', 'box'].includes(s.bg) ? s.bg : d.bg,
    bold: typeof s.bold === 'boolean' ? s.bold : d.bold,
    delay: Math.round(clamp(s.delay, -30, 30, d.delay) * 10) / 10,
    width: clamp(s.width, 40, 100, d.width),
    bgColor: hex(s.bgColor, d.bgColor),
    bgOpacity: clamp(s.bgOpacity, 0, 100, d.bgOpacity),
    bgBlur: clamp(s.bgBlur, 0, 30, d.bgBlur),
    bgPad: Math.round(clamp(s.bgPad, 0.1, 1.5, d.bgPad) * 100) / 100,
    mask: {
      on: typeof m.on === 'boolean' ? m.on : dm.on,
      y: clamp(m.y, 0, 100, dm.y),
      h: clamp(m.h, 2, 60, dm.h),
      w: clamp(m.w, 10, 100, dm.w),
      color: hex(m.color, dm.color),
      opacity: clamp(m.opacity, 0, 100, dm.opacity),
      blur: clamp(m.blur, 0, 40, dm.blur),
      mode: ['band', 'smart'].includes(m.mode) ? m.mode : dm.mode,
      timing: ['always', 'subs'].includes(m.timing) ? m.timing : dm.timing,
      // хуучин ганц "pad" тохиргоотой бол шинэ анхдагч (1 сек) хэрэглэнэ
      padBefore: Math.round(clamp(m.padBefore, 0, 3, dm.padBefore) * 10) / 10,
      padAfter: Math.round(clamp(m.padAfter, 0, 5, dm.padAfter) * 10) / 10,
      threshold: clamp(m.threshold, 120, 255, dm.threshold),
      strength: clamp(m.strength, 2, 24, dm.strength),
      expand: clamp(m.expand, 0, 8, dm.expand),
      textColor: ['white', 'yellow', 'bright'].includes(m.textColor) ? m.textColor : dm.textColor,
      outline: typeof m.outline === 'boolean' ? m.outline : dm.outline,
    },
  };
}

// '#rrggbb' + 0–100% → 'rgba(r,g,b,a)'
export function rgba(hexColor, opacityPct) {
  const h = hexColor.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${(opacityPct / 100).toFixed(2)})`;
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
