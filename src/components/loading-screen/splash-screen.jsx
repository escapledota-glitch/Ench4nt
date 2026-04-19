'use client';

import { useEffect, useRef, useState, Fragment } from 'react';

import Portal from '@mui/material/Portal';
import { styled, keyframes } from '@mui/material/styles';

// ----------------------------------------------------------------------

const glitch = keyframes`
  0%, 90%, 100% { text-shadow: 0 0 20px #9b30ff, 0 0 60px rgba(155,48,255,0.4); transform: none; clip-path: none; }
  91%  { text-shadow: -3px 0 #ff00ff, 3px 0 #00ffff; transform: skewX(-3deg) translateX(2px); }
  92%  { text-shadow:  3px 0 #ff00ff,-3px 0 #00ffff; transform: skewX(3deg) translateX(-2px); clip-path: inset(20% 0 40% 0); }
  93%  { text-shadow: -3px 0 #00ffff, 3px 0 #ff00ff; transform: skewX(-1deg); clip-path: inset(60% 0 10% 0); }
  94%  { text-shadow: 0 0 20px #9b30ff; transform: none; clip-path: none; }
`;

const scanline = keyframes`
  0%   { top: -10%; opacity: 0.7; }
  100% { top: 110%; opacity: 0; }
`;

const borderSpin = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const borderSpinReverse = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.06); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const barFill = keyframes`
  0%   { width: 0%; }
  20%  { width: 18%; }
  45%  { width: 46%; }
  70%  { width: 73%; }
  90%  { width: 91%; }
  100% { width: 100%; }
`;

const twinkle = keyframes`
  0%, 100% { opacity: 0.1; }
  50%       { opacity: 0.8; }
`;

const cornerPulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 1; }
`;

// ----------------------------------------------------------------------

function StarField() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || c.childElementCount) return;
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('div');
      const size = Math.random() * 2 + 0.5;
      const delay = Math.random() * 6;
      Object.assign(s.style, {
        position: 'absolute',
        borderRadius: '50%',
        width: `${size}px`, height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        background: `rgba(${180 + Math.random() * 75},${160 + Math.random() * 60},255,${Math.random() * 0.6 + 0.2})`,
        animation: `${twinkle} ${Math.random() * 4 + 2}s ease-in-out ${delay}s infinite`,
      });
      c.appendChild(s);
    }
  }, []);
  return <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}

// ----------------------------------------------------------------------

export function SplashScreen({ portal = true, slots, slotProps, sx, ...other }) {
  const PortalWrapper = portal ? Portal : Fragment;
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0); // 0=loading text cycles, 1=done

  useEffect(() => {
    // Simulate progress
    const steps = [
      { target: 18, delay: 200 },
      { target: 46, delay: 600 },
      { target: 73, delay: 400 },
      { target: 91, delay: 500 },
      { target: 100, delay: 300 },
    ];
    let t = 0;
    steps.forEach(({ target, delay }) => {
      t += delay;
      setTimeout(() => setProgress(target), t);
    });
    setTimeout(() => setPhase(1), t + 200);
  }, []);

  const loadingTexts = ['СИСТЕМИЙГ АЧААЛЖ БАЙНА', 'ЗАГВАРУУДЫГ БЭЛДЭЖ БАЙНА', 'БЭЛЭН БОЛЛОО'];
  const textIndex = progress < 50 ? 0 : progress < 95 ? 1 : 2;

  return (
    <PortalWrapper>
      <Root sx={sx} {...other}>
        <StarField />

        {/* Nebula glow */}
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,20,200,0.18) 0%, transparent 70%)',
          filter: 'blur(80px)', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none',
          animation: `${pulse} 4s ease-in-out infinite`,
        }} />

        {/* ── Logo square ── */}
        <LogoWrap>
          {/* Spinning border rings */}
          <Ring1 />
          <Ring2 />

          {/* Corner brackets */}
          {[
            { top: -2, left: -2, borderTop: '2px solid #9b30ff', borderLeft: '2px solid #9b30ff' },
            { top: -2, right: -2, borderTop: '2px solid #9b30ff', borderRight: '2px solid #9b30ff' },
            { bottom: -2, left: -2, borderBottom: '2px solid #9b30ff', borderLeft: '2px solid #9b30ff' },
            { bottom: -2, right: -2, borderBottom: '2px solid #9b30ff', borderRight: '2px solid #9b30ff' },
          ].map((style, i) => (
            <div key={i} style={{
              position: 'absolute', width: 14, height: 14, ...style,
              animation: `${cornerPulse} 1.5s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}

          {/* Scanline */}
          <div style={{
            position: 'absolute', left: 0, width: '100%', height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(155,48,255,0.8), transparent)',
            animation: `${scanline} 2.4s linear infinite`,
            pointerEvents: 'none', zIndex: 10,
          }} />

          {/* Square face */}
          <LogoSquare>
            <LogoText>
              ENCH<span>4</span>NT
            </LogoText>
            <CityText>ULAANBAATAR</CityText>
          </LogoSquare>
        </LogoWrap>

        {/* ── Progress bar ── */}
        <ProgressWrap>
          <ProgressTrack>
            <ProgressFill style={{ width: `${progress}%`, transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
            {/* Moving glow dot */}
            <div style={{
              position: 'absolute', top: '50%', left: `${progress}%`,
              transform: 'translate(-50%, -50%)',
              width: 8, height: 8, borderRadius: '50%',
              background: '#9b30ff',
              boxShadow: '0 0 12px 4px rgba(155,48,255,0.8)',
              transition: 'left 0.4s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </ProgressTrack>

          <ProgressMeta>
            <span style={{ fontFamily: '"Orbitron",sans-serif', fontSize: '0.55rem', letterSpacing: '2px', color: '#9b30ff' }}>
              {loadingTexts[textIndex]}
            </span>
            <span style={{ fontFamily: '"Orbitron",sans-serif', fontSize: '0.55rem', color: '#555', letterSpacing: '1px' }}>
              {progress}%
            </span>
          </ProgressMeta>
        </ProgressWrap>
      </Root>
    </PortalWrapper>
  );
}

// ----------------------------------------------------------------------

const Root = styled('div')(({ theme }) => ({
  position: 'fixed', inset: 0, zIndex: 9999,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', gap: 40,
  background: 'radial-gradient(ellipse at 50% 40%, #0d0020 0%, #04000f 50%, #000008 100%)',
  overflow: 'hidden',
}));

const LogoWrap = styled('div')({
  position: 'relative',
  width: 200, height: 200,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});

const Ring1 = styled('div')({
  position: 'absolute', inset: -18,
  borderRadius: 12,
  border: '1.5px solid transparent',
  borderTop: '1.5px solid rgba(155,48,255,0.8)',
  borderRight: '1.5px solid rgba(155,48,255,0.2)',
  animation: `${borderSpin} 2.8s linear infinite`,
});

const Ring2 = styled('div')({
  position: 'absolute', inset: -28,
  borderRadius: 16,
  border: '1px solid transparent',
  borderBottom: '1px solid rgba(155,48,255,0.6)',
  borderLeft: '1px solid rgba(155,48,255,0.15)',
  animation: `${borderSpinReverse} 4s linear infinite`,
});

const LogoSquare = styled('div')({
  width: '100%', height: '100%',
  background: 'linear-gradient(135deg, #0a0018 0%, #120028 60%, #0a0015 100%)',
  border: '1px solid rgba(155,48,255,0.3)',
  borderRadius: 8,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  gap: 6,
  boxShadow: 'inset 0 0 40px rgba(155,48,255,0.08), 0 0 60px rgba(155,48,255,0.15)',
  overflow: 'hidden',
  position: 'relative',
});

const LogoText = styled('div')({
  fontFamily: '"Orbitron", sans-serif',
  fontSize: '2rem',
  fontWeight: 900,
  color: '#e8e8e8',
  letterSpacing: 2,
  animation: `${glitch} 5s infinite`,
  '& span': {
    color: '#9b30ff',
    textShadow: '0 0 20px #9b30ff, 0 0 40px rgba(155,48,255,0.6)',
  },
});

const CityText = styled('div')({
  fontFamily: '"Orbitron", sans-serif',
  fontSize: '0.52rem',
  letterSpacing: '5px',
  color: 'rgba(155,48,255,0.7)',
  textTransform: 'uppercase',
  animation: `${fadeUp} 0.8s ease-out 0.4s both`,
});

const ProgressWrap = styled('div')({
  width: 240,
  display: 'flex', flexDirection: 'column', gap: 10,
  animation: `${fadeUp} 0.6s ease-out 0.2s both`,
});

const ProgressTrack = styled('div')({
  position: 'relative',
  width: '100%', height: 3,
  background: 'rgba(155,48,255,0.12)',
  borderRadius: 2,
  overflow: 'visible',
});

const ProgressFill = styled('div')({
  height: '100%',
  background: 'linear-gradient(90deg, #5000c8, #9b30ff, #c060ff)',
  borderRadius: 2,
  boxShadow: '0 0 10px rgba(155,48,255,0.6)',
});

const ProgressMeta = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});
