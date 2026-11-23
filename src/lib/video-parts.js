// ----------------------------------------------------------------------
// Нэг видеог хэд хэдэн анги (хэсэг) болгон хуваах.
// Хэсгийн эхлэх/дуусах хугацааг видео холбоосын төгсгөлд хадгална:
//   https://…/playlist.m3u8#t=1020,2100   (секундээр; дуусах нь хоосон бол видеоны төгсгөл хүртэл)
// ----------------------------------------------------------------------

// "17:00" | "1:05:30" | "1020" → секунд (буруу бол NaN)
export function parseClock(text) {
  const parts = String(text ?? '').trim().split(':');
  if (!parts[0] || parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return NaN;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

// 1020 → "17:00", 3930 → "1:05:30"
export function formatClock(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

// "…m3u8#t=1020,2100" → { base: "…m3u8", start: 1020, end: 2100 }   (end 0 = видеоны төгсгөл)
export function parsePart(url) {
  const raw = String(url ?? '').trim();
  const m = raw.match(/#t=(\d+(?:\.\d+)?)?(?:,(\d+(?:\.\d+)?))?$/);
  if (!m) return { base: raw, start: 0, end: 0 };
  return { base: raw.slice(0, m.index), start: Number(m[1] || 0), end: Number(m[2] || 0) };
}

export function withPart(base, start, end) {
  const s = Math.max(0, Number(start) || 0);
  const e = Math.max(0, Number(end) || 0);
  if (!s && !e) return base;
  return `${base}#t=${s}${e ? `,${e}` : ''}`;
}
