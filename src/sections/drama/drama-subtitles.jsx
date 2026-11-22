'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import { rgba, DEFAULT_SUB_MASK, DEFAULT_SUB_STYLE } from 'src/lib/subtitles';

// ----------------------------------------------------------------------
// Хадмал харуулах давхарга. Байрлал, хэмжээ, өнгийг админ тохируулна —
// үзэгч өөрчлөх боломжгүй.
// Эх элемент нь `containerType: 'inline-size'` байх ёстой (хэмжээ пропорциональ).
// ----------------------------------------------------------------------

const toSec = (t) => {
  const p = t.trim().split(':').map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
};

export function parseVtt(text) {
  const cues = [];
  String(text)
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .forEach((block) => {
      const lines = block.split('\n');
      const i = lines.findIndex((l) => l.includes('-->'));
      if (i < 0) return;
      const [a, b] = lines[i].split('-->');
      const start = toSec(a);
      const end = toSec(b.trim().split(/\s+/)[0]);
      const body = lines
        .slice(i + 1)
        .join('\n')
        .replace(/<[^>]+>/g, '') // <i>, <b>, <c.color> гэх мэт шошгыг хасна
        .trim();
      if (body && Number.isFinite(start) && Number.isFinite(end)) cues.push({ start, end, text: body });
    });
  return cues;
}

export function useCues(url) {
  const [cues, setCues] = useState([]);
  useEffect(() => {
    if (!url) {
      setCues([]);
      return undefined;
    }
    let alive = true;
    fetch(url)
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => alive && setCues(parseVtt(t)))
      .catch(() => alive && setCues([]));
    return () => {
      alive = false;
    };
  }, [url]);
  return cues;
}

// Зөвхөн харагдах байдал (тоглуулагч болон админы урьдчилан харахад).
// pictureWidth өгвөл үсгийн хэмжээг видеоны зурагны өргөнөөр тооцно (px) —
// жижиг горим, бүтэн дэлгэц, ямар ч утсан дээр зурагтай харьцуулахад ижил харагдана.
export function SubtitleText({ text, style, pictureWidth }) {
  const s = { ...DEFAULT_SUB_STYLE, ...style };
  if (!text) return null;

  // Бүдгэрүүлэлтийг зурагны хэмжээнд пропорциональ болгоно
  const scale = pictureWidth ? pictureWidth / 390 : 1;
  const blur = (s.bgBlur || 0) * scale;

  const bgSx =
    s.bg === 'box'
      ? {
          bgcolor: rgba(s.bgColor || '#000000', s.bgOpacity ?? 72),
          px: `${s.bgPad ?? 0.45}em`,
          py: `${((s.bgPad ?? 0.45) / 3).toFixed(2)}em`,
          borderRadius: '0.25em',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          // бүдгэрүүлэлт нь мөрийн хайрцаг биш, нэг блок дээр ажилладаг
          ...(blur > 0 && {
            display: 'inline-block',
            backdropFilter: `blur(${blur.toFixed(1)}px)`,
            WebkitBackdropFilter: `blur(${blur.toFixed(1)}px)`,
          }),
        }
      : s.bg === 'shadow'
        ? { textShadow: '0 0 0.25em rgba(0,0,0,0.95), 0 0.08em 0.15em rgba(0,0,0,0.95), 0 0 0.6em rgba(0,0,0,0.7)' }
        : {};

  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${s.x}%`,
        top: `${s.y}%`,
        transform: 'translate(-50%, -50%)',
        width: `${s.width}%`,
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <Box
        component="span"
        sx={{
          color: s.color,
          fontWeight: s.bold ? 800 : 500,
          fontSize: pictureWidth ? `${((s.size * pictureWidth) / 390).toFixed(2)}px` : `${(s.size / 3.9).toFixed(2)}cqw`,
          lineHeight: 1.35,
          whiteSpace: 'pre-line',
          ...bgSx,
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------
// Эх видеон дээр шатаагдсан хуучин хадмалыг нуух тууз.
// box: зурагны байрлал (тоглуулагчид) — байхгүй бол эх элементээ бүрэн хамарна (админы урьдчилан харах).
export function CoverMask({ style, box }) {
  const m = { ...DEFAULT_SUB_MASK, ...(style?.mask || {}) };
  if (!m.on) return null;
  const scale = box ? box.width / 390 : 1;
  const blur = (m.blur || 0) * scale;

  const band = (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        left: '50%',
        top: `${m.y}%`,
        width: `${m.w}%`,
        height: `${m.h}%`,
        transform: 'translate(-50%, -50%)',
        bgcolor: rgba(m.color, m.opacity),
        backdropFilter: blur > 0 ? `blur(${blur.toFixed(1)}px)` : 'none',
        WebkitBackdropFilter: blur > 0 ? `blur(${blur.toFixed(1)}px)` : 'none',
        // ирмэгийг зөөлрүүлнэ — хурц шугам харагдахгүй
        maskImage: 'linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)',
        pointerEvents: 'none',
      }}
    />
  );

  if (!box) return band;
  return (
    <Box sx={{ position: 'absolute', left: box.left, top: box.top, width: box.width, height: box.height, pointerEvents: 'none', zIndex: 1 }}>
      {band}
    </Box>
  );
}

// Тоглуулагч дээр — видеоны цагийг дагана.
// box: видеоны зураг дэлгэц дээр яг хаана байгаа ({ left, top, width, height } px) —
// хадмалыг зурагт наана. Дэлгэцээс илүү гарсан хэсэгт (тайрагдсан) текст гарахгүй.
export function SubtitleOverlay({ videoRef, url, style, box }) {
  const cues = useCues(url);
  const [text, setText] = useState('');
  const delay = Number(style?.delay) || 0;

  useEffect(() => {
    if (!cues.length) {
      setText('');
      return undefined;
    }
    let raf;
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        const t = v.currentTime - delay;
        const cue = cues.find((c) => t >= c.start && t <= c.end);
        const next = cue ? cue.text : '';
        setText((prev) => (prev === next ? prev : next));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cues, delay, videoRef]);

  if (!box) return <SubtitleText text={text} style={style} />;

  // Хэвтээ байрлал: дэлгэц дээр харагдаж буй хэсэгт (зураг хажуугаараа тайрагдсан бол)
  return (
    <Box
      sx={{
        position: 'absolute',
        top: box.top,
        height: box.height,
        left: Math.max(0, box.left),
        width: Math.min(box.width, box.visibleWidth ?? box.width),
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <SubtitleText text={text} style={style} pictureWidth={box.width} />
    </Box>
  );
}

// ----------------------------------------------------------------------
// Видеоны зураг (object-fit: cover) дэлгэц дээр хаана, ямар хэмжээтэй байгааг тооцно
// ready: тоглуулагч дэлгэц дээр гарсан эсэх (гарсан даруйд хэмжинэ)
export function usePictureBox(frameRef, aspect, ready = true) {
  const [box, setBox] = useState(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!ready || !el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const fw = el.clientWidth;
      const fh = el.clientHeight;
      if (!fw || !fh) return;
      const ar = aspect || 9 / 16;
      // cover: зураг дэлгэцийг бүрэн дүүргэнэ, илүү хэсэг нь тайрагдана
      const w = fw / fh > ar ? fw : fh * ar;
      const h = w / ar;
      setBox({ width: w, height: h, left: (fw - w) / 2, top: (fh - h) / 2, visibleWidth: fw });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [frameRef, aspect, ready]);

  return box;
}
