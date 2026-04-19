'use client';

import { useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { keyframes } from '@mui/system';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

const galaxyRotate = keyframes`
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
`;

const nebulaPulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.08); }
`;

const gridMove = keyframes`
  from { background-position: 0 0; }
  to   { background-position: 0 60px; }
`;

const glitchTitle = keyframes`
  0%, 93%, 100% {
    text-shadow: 0 0 20px #9b30ff, 0 0 60px rgba(155,48,255,0.4);
    transform: none;
  }
  94%   { text-shadow: -4px 0 #ff00ff, 4px 0 #00ffff; transform: skewX(-2deg); }
  95.5% { text-shadow:  4px 0 #ff00ff,-4px 0 #00ffff; transform: skewX(2deg);  }
  96%   { text-shadow: 0 0 20px #9b30ff; transform: none; }
`;

const scrollPulse = keyframes`
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 1; }
`;

// ----------------------------------------------------------------------

export function Ench4ntHeroView() {
  const starsRef = useRef(null);

  useEffect(() => {
    const c = starsRef.current;
    if (!c || c.childElementCount) return;

    // ── Stars ────────────────────────────────────────────────────────────
    for (let i = 0; i < 260; i++) {
      const s = document.createElement('div');
      const size = Math.random() < 0.85 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.5 + 1.5;
      const brightness = Math.random();
      const colorR = brightness > 0.7
        ? `rgba(200,180,255,${Math.random() * 0.7 + 0.3})`   // purple-white
        : brightness > 0.4
          ? `rgba(180,220,255,${Math.random() * 0.6 + 0.2})` // blue-white
          : `rgba(255,255,255,${Math.random() * 0.5 + 0.2})`; // pure white

      const duration = Math.random() * 4 + 2;
      const delay = Math.random() * 8;

      Object.assign(s.style, {
        position: 'absolute',
        borderRadius: '50%',
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        background: colorR,
        animation: `e4twinkle ${duration}s ease-in-out ${delay}s infinite`,
        // bright stars get a tiny glow
        ...(size > 2.5 && { boxShadow: `0 0 ${size * 2}px rgba(180,180,255,0.6)` }),
      });
      c.appendChild(s);
    }

    // ── Shooting stars ────────────────────────────────────────────────────
    for (let i = 0; i < 4; i++) {
      const ss = document.createElement('div');
      const top = Math.random() * 50;
      const left = Math.random() * 60 + 10;
      const delay = Math.random() * 12 + i * 4;
      Object.assign(ss.style, {
        position: 'absolute',
        top: `${top}%`,
        left: `${left}%`,
        width: '120px',
        height: '1px',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.8), transparent)',
        borderRadius: '1px',
        opacity: 0,
        transform: 'rotate(-30deg)',
        animation: `e4shoot 0.6s ease-out ${delay}s infinite`,
        animationDelay: `${delay}s`,
      });
      c.appendChild(ss);
    }
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#000008',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 3,
        pt: '100px',
        pb: '60px',

        '@keyframes e4twinkle': {
          '0%, 100%': { opacity: 0.15, transform: 'scale(1)' },
          '50%':      { opacity: 0.95, transform: 'scale(1.3)' },
        },
        '@keyframes e4shoot': {
          '0%':   { opacity: 0, transform: 'rotate(-30deg) translateX(0)' },
          '10%':  { opacity: 1 },
          '100%': { opacity: 0, transform: 'rotate(-30deg) translateX(200px)' },
        },
      }}
    >
      {/* ── Video background ── */}
      <Box
        component="video"
        autoPlay
        muted
        loop
        playsInline
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </Box>

      {/* ── Dark overlay so text stays readable ── */}
      <Box sx={{ position: 'absolute', inset: 0, background: 'rgba(0,0,8,0.62)', zIndex: 1, pointerEvents: 'none' }} />

      {/* ── Stars layer ── */}
      <Box
        ref={starsRef}
        sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      />

      {/* ── Galaxy spiral (slow rotation) ── */}
      <Box
        sx={{
          position: 'absolute',
          width: '140vmax',
          height: '140vmax',
          top: '50%', left: '50%',
          background: `
            conic-gradient(
              from 0deg,
              transparent 0%,
              rgba(155,48,255,0.04) 15%,
              transparent 30%,
              rgba(80,0,200,0.03) 50%,
              transparent 65%,
              rgba(155,48,255,0.04) 80%,
              transparent 100%
            )
          `,
          animation: `${galaxyRotate} 80s linear infinite`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Nebula blobs ── */}
      {/* Large purple core */}
      <Box sx={{
        position: 'absolute', width: 800, height: 800, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(120,20,200,0.22) 0%, rgba(80,0,160,0.1) 50%, transparent 70%)',
        filter: 'blur(70px)', top: '-15%', left: '5%',
        animation: `${nebulaPulse} 8s ease-in-out infinite`, pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Blue nebula right */}
      <Box sx={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,80,255,0.15) 0%, rgba(0,40,180,0.08) 50%, transparent 70%)',
        filter: 'blur(80px)', top: '20%', right: '-5%',
        animation: `${nebulaPulse} 10s ease-in-out -3s infinite`, pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Pink/magenta bottom */}
      <Box sx={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(220,0,180,0.12) 0%, rgba(160,0,120,0.06) 50%, transparent 70%)',
        filter: 'blur(90px)', bottom: '5%', left: '20%',
        animation: `${nebulaPulse} 12s ease-in-out -6s infinite`, pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Cyan top-right */}
      <Box sx={{
        position: 'absolute', width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,220,0.1) 0%, transparent 70%)',
        filter: 'blur(60px)', top: '10%', right: '25%',
        animation: `${nebulaPulse} 7s ease-in-out -2s infinite`, pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Center glow */}
      <Box sx={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(155,48,255,0.18) 0%, transparent 65%)',
        filter: 'blur(50px)', top: '35%', left: '40%',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Subtle animated grid ── */}
      <Box
        sx={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(155,48,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(155,48,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          animation: `${gridMove} 14s linear infinite`,
        }}
      />

      {/* ── Hero content ── */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>

        <Box sx={{
          fontFamily: '"Orbitron", sans-serif',
          fontSize: '0.7rem',
          letterSpacing: '5px',
          color: '#9b30ff',
          textTransform: 'uppercase',
          mb: 2,
        }}>
          // Загварын ирээдүй //
        </Box>

        <Box
          component="h1"
          sx={{
            fontFamily: '"Orbitron", sans-serif',
            fontSize: 'clamp(2.8rem, 9vw, 7rem)',
            fontWeight: 900,
            lineHeight: 1,
            color: '#e8e8e8',
            m: 0, mb: 2,
            animation: `${glitchTitle} 8s infinite`,
            '& span': { color: '#9b30ff' },
          }}
        >
          ENCH<span>4</span>NT<br />STUDIO
        </Box>

        <Box sx={{ fontSize: '1.3rem', color: '#e8e8e8', letterSpacing: '4px', textTransform: 'uppercase', mb: 5 }}>
          Өөрийнхөө брендээ бүтээ
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* ── SHOP NOW ── */}
          <Button
            component={RouterLink}
            href={paths.product.root}
            sx={{
              fontFamily: '"Orbitron", sans-serif',
              fontSize: '0.82rem', fontWeight: 800, letterSpacing: '4px',
              color: '#fff',
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #9b30ff 0%, #5000c8 50%, #9b30ff 100%)',
              backgroundSize: '200% 100%',
              clipPath: 'polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)',
              px: 5.5, py: 2.2, borderRadius: 0, border: 'none',
              boxShadow: '0 0 30px rgba(155,48,255,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
              animation: 'shopBgSlide 3s ease-in-out infinite',
              transition: 'all 0.3s',
              '@keyframes shopBgSlide': {
                '0%':   { backgroundPosition: '0% 50%' },
                '50%':  { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' },
              },
              '@keyframes shopShimmer': {
                '0%':   { left: '-80%' },
                '60%, 100%': { left: '130%' },
              },
              '@keyframes shopPulse': {
                '0%, 100%': { boxShadow: '0 0 30px rgba(155,48,255,0.6), inset 0 1px 0 rgba(255,255,255,0.15)' },
                '50%':       { boxShadow: '0 0 60px rgba(155,48,255,0.9), 0 0 100px rgba(155,48,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' },
              },
              animationName: 'shopBgSlide, shopPulse',
              animationDuration: '3s, 2.5s',
              animationTimingFunction: 'ease-in-out, ease-in-out',
              animationIterationCount: 'infinite, infinite',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0, left: '-80%',
                width: '55%', height: '100%',
                background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)',
                skewX: '-20deg',
                animation: 'shopShimmer 2.8s ease-in-out infinite',
                pointerEvents: 'none',
              },
              '&:hover': {
                transform: 'translateY(-4px) scale(1.04)',
                boxShadow: '0 0 80px rgba(155,48,255,1), 0 8px 32px rgba(155,48,255,0.5)',
              },
            }}
          >
            🛍 ДЭЛГҮҮР
          </Button>

          {/* ── ЗАГВАР БҮТЭЭХ ── */}
          <Button
            component={RouterLink}
            href="/customizer"
            sx={{
              fontFamily: '"Orbitron", sans-serif',
              fontSize: '0.82rem', fontWeight: 800, letterSpacing: '4px',
              color: '#c880ff',
              position: 'relative', overflow: 'hidden',
              background: 'transparent',
              clipPath: 'polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)',
              px: 5, py: 2.2, borderRadius: 0,
              border: 'none',
              outline: '1.5px solid rgba(155,48,255,0.5)',
              boxShadow: 'inset 0 0 20px rgba(155,48,255,0.06)',
              transition: 'all 0.3s',
              '@keyframes designGlow': {
                '0%, 100%': { outline: '1.5px solid rgba(155,48,255,0.5)', color: '#c880ff', boxShadow: 'inset 0 0 20px rgba(155,48,255,0.06)' },
                '50%':       { outline: '1.5px solid rgba(200,120,255,0.9)', color: '#e0aaff', boxShadow: 'inset 0 0 30px rgba(155,48,255,0.15), 0 0 30px rgba(155,48,255,0.3)' },
              },
              '@keyframes designScan': {
                '0%':        { top: '-5%', opacity: 0.6 },
                '100%':      { top: '105%', opacity: 0 },
              },
              animation: 'designGlow 2.2s ease-in-out infinite',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0, top: '-5%',
                width: '100%', height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(155,48,255,0.7), transparent)',
                animation: 'designScan 2.5s linear infinite',
                pointerEvents: 'none',
              },
              '&:hover': {
                background: 'rgba(155,48,255,0.12)',
                color: '#fff',
                transform: 'translateY(-4px) scale(1.04)',
                outline: '1.5px solid #b060ff',
                boxShadow: '0 0 50px rgba(155,48,255,0.5), inset 0 0 30px rgba(155,48,255,0.12)',
              },
            }}
          >
            ✦ ЗАГВАР БҮТЭЭХ
          </Button>
        </Box>
      </Box>

      {/* ── Scroll indicator ── */}
      <Box
        sx={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
          opacity: 0.4, zIndex: 2,
        }}
      >
        <Box sx={{ width: '1px', height: 40, background: 'linear-gradient(#9b30ff, transparent)', animation: `${scrollPulse} 2s ease-in-out infinite` }} />
        <Box sx={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.6rem', letterSpacing: '3px', color: '#9b30ff' }}>
          SCROLL
        </Box>
      </Box>
    </Box>
  );
}
