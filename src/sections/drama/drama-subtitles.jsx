'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

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
// Хадмалын одоогийн мөр + манай хадмал гарах мөчийн ойролцоо эсэх (before сек өмнөөс, after сек дараа хүртэл).
// Хуучин (шатаагдсан) хадмал ихэвчлэн яг ижил мөчид гардаг тул туузыг тэр үед л харуулна.
export function useCueState(videoRef, cues, delay = 0, before = 0, after = 0) {
  const [state, setState] = useState({ text: '', near: false });

  useEffect(() => {
    if (!cues.length) {
      setState({ text: '', near: false });
      return undefined;
    }
    let raf;
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        const t = v.currentTime - delay;
        const cue = cues.find((c) => t >= c.start && t <= c.end);
        const text = cue ? cue.text : '';
        const near = !!cue || ((before > 0 || after > 0) && cues.some((c) => t >= c.start - before && t <= c.end + after));
        setState((prev) => (prev.text === text && prev.near === near ? prev : { text, near }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cues, delay, before, after, videoRef]);

  return state;
}

// Зурагны байрлалд наасан давхарга
function PictureLayer({ box, children }) {
  if (!box) return children;
  return (
    <Box
      sx={{
        position: 'absolute',
        top: box.top,
        height: box.height,
        left: box.left,
        width: box.width,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {children}
    </Box>
  );
}

// Хадмал гарч буй мөчүүд (кино даяар жигд тараасан) — тааруулахдаа тэр кадр руу үсрэхэд
export function pickCueMoments(cues, n = 10) {
  const long = cues.filter((c) => c.end - c.start >= 1);
  if (!long.length) return [];
  const step = Math.max(1, Math.floor(long.length / n));
  const out = [];
  for (let i = 0; i < long.length && out.length < n; i += step) {
    out.push(+(long[i].start + Math.min(0.6, (long[i].end - long[i].start) / 2)).toFixed(2));
  }
  return out;
}

// ----------------------------------------------------------------------
// "Зөвхөн цагаан бичгийг бүдгэрүүлэх": туузны доторх цагаан пикселүүдийг олж,
// эргэн тойрных нь (цагаан биш) зургийн өнгөөр бөглөнө. Бусад хэсэг тод хэвээр.
// Жижиг хэмжээнд (≈320px өргөн) боловсруулдаг тул утсан дээр хөнгөн.

function boxSum(src, dst, W, H, r, horizontal) {
  const len = horizontal ? W : H;
  const lines = horizontal ? H : W;
  for (let l = 0; l < lines; l += 1) {
    const idx = (k) => (horizontal ? l * W + k : k * W + l);
    let acc = 0;
    for (let k = 0; k <= Math.min(r, len - 1); k += 1) acc += src[idx(k)];
    for (let k = 0; k < len; k += 1) {
      dst[idx(k)] = acc;
      const add = k + r + 1;
      const sub = k - r;
      if (add < len) acc += src[idx(add)];
      if (sub >= 0) acc -= src[idx(sub)];
    }
  }
}

export function inpaintWhiteText(data, W, H, { threshold = 200, strength = 8, expand = 2, textColor = 'white', outline = true }) {
  const N = W * H;
  let mask = new Float32Array(N);
  for (let i = 0; i < N; i += 1) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    const isText =
      textColor === 'yellow'
        ? r >= threshold - 20 && g >= threshold - 40 && b < g - 60 // шар: улаан, ногоон өндөр, цэнхэр бага
        : textColor === 'bright'
          ? lum >= threshold // ямар ч өнгийн тод бичиг
          : lum >= threshold && sat <= 70; // цагаан
    if (isText) mask[i] = 1;
  }
  // Хадмалын үсэг бараан хүрээ/сүүдэртэй байдаг. Ойролцоо (2px) бараан пиксел байхгүй
  // тод хэсгийг (цагаан хувцас, хана, гэрэл) бичиг гэж үзэхгүй.
  if (outline) {
    const dark = new Float32Array(N);
    for (let i = 0; i < N; i += 1) {
      const lum = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
      if (lum < 90) dark[i] = 1;
    }
    const t1 = new Float32Array(N);
    const near = new Float32Array(N);
    boxSum(dark, t1, W, H, 2, true);
    boxSum(t1, near, W, H, 2, false);
    // Үсгийн зураас нарийн тул хүрээнээс 3px-ээс хол цагаан пиксел ч бичиг биш
    const t2 = new Float32Array(N);
    const near3 = new Float32Array(N);
    boxSum(dark, t2, W, H, 3, true);
    boxSum(t2, near3, W, H, 3, false);
    for (let i = 0; i < N; i += 1) if (mask[i] && !(near[i] > 0 || near3[i] > 2)) mask[i] = 0;
  }
  // Ирмэгийг томруулна (үсгийн хар хүрээ, сүүдрийг ч хамарна)
  if (expand > 0) {
    const tmp = new Float32Array(N);
    const tmp2 = new Float32Array(N);
    boxSum(mask, tmp, W, H, expand, true);
    boxSum(tmp, tmp2, W, H, expand, false);
    mask = tmp2.map((v) => (v > 0 ? 1 : 0));
  }
  // Цагаан биш пикселийн өнгөний жигнэсэн дундаж (normalized box blur)
  const ch = [new Float32Array(N), new Float32Array(N), new Float32Array(N), new Float32Array(N)];
  for (let i = 0; i < N; i += 1) {
    const w = mask[i] ? 0 : 1;
    ch[0][i] = data[i * 4] * w;
    ch[1][i] = data[i * 4 + 1] * w;
    ch[2][i] = data[i * 4 + 2] * w;
    ch[3][i] = w;
  }
  const t = new Float32Array(N);
  const outCh = ch.map((c) => {
    const o = new Float32Array(N);
    boxSum(c, t, W, H, strength, true);
    boxSum(t, o, W, H, strength, false);
    return o;
  });
  const out = new ImageData(W, H);
  for (let i = 0; i < N; i += 1) {
    const ww = outCh[3][i];
    if (mask[i] && ww > 0.5) {
      out.data[i * 4] = outCh[0][i] / ww;
      out.data[i * 4 + 1] = outCh[1][i] / ww;
      out.data[i * 4 + 2] = outCh[2][i] / ww;
      out.data[i * 4 + 3] = 255;
    }
  }
  return out;
}

function SmartTextBlur({ videoRef, mask, active, onFail }) {
  const canvasRef = useRef(null);
  const { w: mw, h: mh, y: my, threshold, strength, expand, textColor, outline } = mask;

  useEffect(() => {
    const v = videoRef?.current;
    const out = canvasRef.current;
    if (!active || !v || !out) {
      if (out) out.getContext('2d').clearRect(0, 0, out.width, out.height);
      return undefined;
    }
    const work = document.createElement('canvas');
    const wctx = work.getContext('2d', { willReadFrequently: true });
    const octx = out.getContext('2d');
    let raf;
    let last = -1;
    let lastRun = 0;

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (now - lastRun < 50) return; // ≈20fps — хадмалд хангалттай, утсанд хөнгөн
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      if (!vw || !vh || v.readyState < 2) return;
      if (v.paused && v.currentTime === last) return; // зогссон үед дахин боловсруулахгүй
      last = v.currentTime;
      lastRun = now;

      const sw = (vw * mw) / 100;
      const sh = (vh * mh) / 100;
      const sx = (vw - sw) / 2;
      const sy = (vh * my) / 100 - sh / 2;
      const W = Math.max(64, Math.round((320 * mw) / 100));
      const H = Math.max(8, Math.round((W * sh) / sw));
      if (work.width !== W || work.height !== H) {
        work.width = W;
        work.height = H;
        out.width = W;
        out.height = H;
      }
      try {
        wctx.drawImage(v, sx, sy, sw, sh, 0, 0, W, H);
        const img = wctx.getImageData(0, 0, W, H);
        octx.putImageData(inpaintWhiteText(img.data, W, H, { threshold, strength, expand, textColor, outline }), 0, 0);
      } catch {
        // Видеоны зургийг унших эрхгүй (CORS) — энгийн бүдэг тууз руу шилжинэ
        cancelAnimationFrame(raf);
        onFail?.();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, videoRef, mw, mh, my, threshold, strength, expand, textColor, outline, onFail]);

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      aria-hidden
      sx={{ position: 'absolute', inset: 0, width: 1, height: 1, filter: 'blur(0.6px)', opacity: active ? 1 : 0 }}
    />
  );
}

// ----------------------------------------------------------------------
// Эх видеон дээр шатаагдсан хуучин хадмалыг нуух хаалт.
// visible: одоо харуулах эсэх (timing = 'subs' үед манай хадмалтай зэрэг)
export function CoverMask({ style, box, visible = true, videoRef, guide = false }) {
  const m = { ...DEFAULT_SUB_MASK, ...(style?.mask || {}) };
  const [smartFailed, setSmartFailed] = useState(false);
  const onFail = useCallback(() => setSmartFailed(true), []);
  if (!m.on) return null;

  const scale = box ? box.width / 390 : 1;
  const smart = m.mode === 'smart' && !!videoRef && !smartFailed;
  const blur = (m.blur || 0) * scale;

  return (
    <PictureLayer box={box}>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: '50%',
          top: `${m.y}%`,
          width: `${m.w}%`,
          height: `${m.h}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          opacity: visible || guide ? 1 : 0,
          transition: 'opacity 140ms ease',
          ...(!smart && {
            bgcolor: rgba(m.color, m.opacity),
            backdropFilter: blur > 0 ? `blur(${blur.toFixed(1)}px)` : 'none',
            WebkitBackdropFilter: blur > 0 ? `blur(${blur.toFixed(1)}px)` : 'none',
            // ирмэгийг зөөлрүүлнэ — хурц шугам харагдахгүй
            maskImage: 'linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)',
          }),
        }}
      >
        {smart && <SmartTextBlur videoRef={videoRef} mask={m} active={visible} onFail={onFail} />}
        {/* Тааруулах үед: хаалтын хүрээг үргэлж харуулна */}
        {guide && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              border: '2px dashed #facc15',
              borderRadius: '4px',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.6)',
              pointerEvents: 'none',
            }}
          >
            <Box
              component="span"
              sx={{ position: 'absolute', left: 4, top: -18, px: 0.6, fontSize: 10, fontWeight: 700, color: '#1a1200', bgcolor: '#facc15', borderRadius: 0.5 }}
            >
              {smart ? 'Бичиг бүдгэрүүлэх хэсэг' : 'Хаалт тууз'}
            </Box>
          </Box>
        )}
      </Box>
    </PictureLayer>
  );
}

// ----------------------------------------------------------------------
// Тоглуулагч (болон админы урьдчилан харах): хаалт + хадмал, видеоны цагийг дагана.
// box: видеоны зураг дэлгэц дээр яг хаана байгаа ({ left, top, width, height } px).
export function SubtitleLayers({ videoRef, url, style, box, showText = true, editing = false }) {
  const cues = useCues(url);
  const m = { ...DEFAULT_SUB_MASK, ...(style?.mask || {}) };
  const delay = Number(style?.delay) || 0;
  const useMargins = m.mode === 'smart' || m.timing === 'subs';
  const { text, near } = useCueState(videoRef, cues, delay, useMargins ? m.padBefore : 0, useMargins ? m.padAfter : 0);
  // "Зөвхөн бичиг" горимд манай хадмал гарах үед л ажиллана (бусад үед киноны цагаан зүйлд хүрэхгүй)
  const timing = m.mode === 'smart' ? 'subs' : m.timing;
  // Тааруулах үед эффектийг үргэлж харуулна (зогсоосон кадр дээр үр дүнг харахын тулд)
  const maskVisible = m.on && (editing || timing === 'always' || !cues.length || near);

  return (
    <>
      <CoverMask style={style} box={box} visible={maskVisible} videoRef={videoRef} guide={editing && m.on} />
      {showText &&
        (box ? (
          // Хэвтээ байрлал: дэлгэц дээр харагдаж буй хэсэгт (зураг хажуугаараа тайрагдсан бол)
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
        ) : (
          <SubtitleText text={text} style={style} />
        ))}
    </>
  );
}

// Хуучин нэр (нийцтэй байлгах)
export const SubtitleOverlay = SubtitleLayers;

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
