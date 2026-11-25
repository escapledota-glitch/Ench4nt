'use client';

import { useId } from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------
// 444 KINO лого — "Badge": ягаан-нил өнгийн бөөрөнхий дөрвөлжин тоглуулах
// тэмдэг + том цагаан "444" + өнгөт "KINO".
// ----------------------------------------------------------------------

const FONT = '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif';

// Зөвхөн тэмдэг (апп-ын icon, жижиг газар)
export function KinoMark({ size = 32, glow = true, sx }) {
  const id = useId().replace(/:/g, '');
  return (
    <Box
      component="svg"
      viewBox="0 0 128 128"
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'block',
        filter: glow ? 'drop-shadow(0 0 10px rgba(212,175,106,0.45))' : 'none',
        ...sx,
      }}
    >
      <defs>
        <linearGradient id={`kg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dca4" />
          <stop offset="0.5" stopColor="#d4af6a" />
          <stop offset="1" stopColor="#9c7638" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="34" fill={`url(#kg-${id})`} />
      <rect x="3" y="3" width="122" height="60" rx="31" fill="#fff" opacity="0.13" />
      <path d="M50 36 L96 64 L50 92 Z" fill="#1b1408" />
    </Box>
  );
}

// Бүтэн лого: тэмдэг + 444 + KINO
export function KinoLogo({ height = 32, showKino = true, sx }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: `${height * 0.32}px`, fontFamily: FONT, lineHeight: 1, ...sx }}>
      <KinoMark size={height} />
      <Box
        component="span"
        sx={{ fontSize: height * 0.92, fontWeight: 900, letterSpacing: `${-height * 0.04}px`, color: '#fff' }}
      >
        444
      </Box>
      {showKino && (
        <Box
          component="span"
          sx={{
            fontSize: height * 0.42,
            fontWeight: 800,
            letterSpacing: `${height * 0.1}px`,
            background: 'linear-gradient(90deg, #f3dca4, #d4af6a 55%, #b88a3e)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            pl: `${height * 0.04}px`,
          }}
        >
          KINO
        </Box>
      )}
    </Box>
  );
}
