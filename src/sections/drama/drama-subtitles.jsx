'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import { DEFAULT_SUB_STYLE } from 'src/lib/subtitles';

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

// Зөвхөн харагдах байдал (тоглуулагч болон админы урьдчилан харахад)
export function SubtitleText({ text, style }) {
  const s = { ...DEFAULT_SUB_STYLE, ...style };
  if (!text) return null;

  const bgSx =
    s.bg === 'box'
      ? { bgcolor: 'rgba(0,0,0,0.72)', px: '0.45em', py: '0.15em', borderRadius: '0.25em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }
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
          fontSize: `${(s.size / 3.9).toFixed(2)}cqw`,
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

// Тоглуулагч дээр — видеоны цагийг дагана
export function SubtitleOverlay({ videoRef, url, style }) {
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

  return <SubtitleText text={text} style={style} />;
}
