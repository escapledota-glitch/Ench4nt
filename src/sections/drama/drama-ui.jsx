'use client';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { useDramaAuth } from './drama-auth';
import { priceOf, isForSale, formatPrice } from './drama-data';

// ----------------------------------------------------------------------
// 444 Кино — өнгө, фонт, icon, постер карт, хөдөлгөөн
// ----------------------------------------------------------------------

// Хар & алтан (luxury) өнгө
export const C = {
  bg: '#0b0a09',
  surface: '#15120e',
  surface2: '#1f1a14',
  line: 'rgba(255,236,200,0.09)',
  text: '#f6f1e8',
  muted: 'rgba(246,241,232,0.62)',
  accent: '#d4af6a',
  accent2: '#e9cf94',
  gold: '#e3c07a',
  grad: 'linear-gradient(135deg, #f3dca4 0%, #d4af6a 48%, #a9823f 100%)',
  glow: '0 0 0 1px rgba(212,175,106,0.45), 0 18px 50px -14px rgba(212,175,106,0.45)',
  // алтан дэвсгэр дээрх бичгийн өнгө (цагаан нь алтан дээр уншигдахгүй)
  ink: '#1b1408',
};

// Кирилл үсэг дэмждэг фонт (global.css-д ачаалагдсан)
export const FONT = '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif';

const PATHS = {
  play: 'M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14z',
  pause: 'M7 4h3v16H7zM14 4h3v16h-3z',
  lock: 'M17 9V7A5 5 0 0 0 7 7v2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zM9 7a3 3 0 0 1 6 0v2H9z',
  back: 'M15.5 4.5 8 12l7.5 7.5',
  chevronRight: 'M9 5l7 7-7 7',
  search: 'M11 4a7 7 0 1 0 4.4 12.4l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z',
  home: 'M12 3 3 10.5V21h6v-6h6v6h6V10.5z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  heart:
    'M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.1 1.7-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z',
  list: 'M4 6h16v2H4zM4 11h16v2H4zM4 16h16v2H4z',
  share:
    'M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.4a3 3 0 0 0 0-1.6l6.7-3.4A3 3 0 1 0 15 7a3 3 0 0 0 .1.8L8.4 11.2a3 3 0 1 0 0 3.6l6.7 3.4A3 3 0 1 0 18 16z',
  close: 'M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z',
  fire: 'M13 2s1 3-1.5 6S8 11.5 8 14a4 4 0 0 0 8 0c0-1.5-.7-2.6-.7-2.6S19 13 19 16a7 7 0 0 1-14 0c0-6 8-8 8-14z',
  star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z',
  bell: 'M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z',
  shield: 'M12 2 4 5v6c0 5 3.4 9.6 8 11 4.6-1.4 8-6 8-11V5z',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z',
  crown: 'M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5zM5 20h14v1.5H5z',
  check: 'M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z',
  logout: 'M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5v-2H6V6h4zm6.6 3.6-1.4 1.4 2 2H9v2h8.2l-2 2 1.4 1.4L21 12z',
  volumeOff: 'M3 9v6h4l5 5V4L7 9zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z',
  volumeOn: 'M3 9v6h4l5 5V4L7 9zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
  fullscreen: 'M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z',
  fullscreenExit: 'M8 4h2v6H4V8h4zm6 0h2v4h4v2h-6zM4 14h6v6H8v-4H4zm10 0h6v2h-4v4h-2z',
  settings:
    'M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L4.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z',
  coin: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15v1.5h-2V17a3.5 3.5 0 0 1-2.8-3h2a1.5 1.5 0 0 0 1.5 1.2h1a1.3 1.3 0 0 0 .3-2.5l-2.6-.7A3.2 3.2 0 0 1 11 6.1V4.5h2v1.6A3.4 3.4 0 0 1 15.7 9h-2a1.4 1.4 0 0 0-1.3-1h-.9a1.2 1.2 0 0 0-.3 2.4l2.6.7A3.3 3.3 0 0 1 13 17z',
};

const STROKED = ['back', 'chevronRight'];

export function Icon({ name, size = 22, sx, ...other }) {
  const stroked = STROKED.includes(name);
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden
      sx={{ width: size, height: size, flexShrink: 0, display: 'block', ...sx }}
      {...other}
    >
      <path
        d={PATHS[name]}
        fill={stroked ? 'none' : 'currentColor'}
        stroke={stroked ? 'currentColor' : 'none'}
        strokeWidth={stroked ? 2.4 : 0}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}

// ----------------------------------------------------------------------
// Гүйлгэхэд аажмаар гарч ирэх (хөдөлгөөн багасгах тохиргоог хүндэтгэнэ)

export function Reveal({ children, delay = 0, sx }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(28px)',
        transition: `opacity 700ms ease ${delay}ms, transform 800ms cubic-bezier(.2,.8,.2,1) ${delay}ms`,
        '@media (prefers-reduced-motion: reduce)': { opacity: 1, transform: 'none', transition: 'none' },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// ----------------------------------------------------------------------

export function Badge({ children, sx }) {
  return (
    <Box
      component="span"
      sx={{
        px: 0.9,
        py: 0.35,
        borderRadius: 1,
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        lineHeight: 1.3,
        color: children === 'Топ' ? C.gold : C.ink,
        background: children === 'Топ' ? 'rgba(15,12,9,0.75)' : C.grad,
        border: children === 'Топ' ? '1px solid rgba(212,175,106,0.6)' : '1px solid transparent',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 4px 14px -6px rgba(212,175,106,0.55)',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// Постерын баруун дээд буланд — үнэ эсвэл "Таных"
// Үнийн шошго харагдах эсэх (багцтай хүнд үнэ харуулахгүй)
export function usePriceTagVisible(series) {
  const { owns, isSubscribed } = useDramaAuth();
  if (!isForSale(series)) return false;
  return !(isSubscribed && !owns(series.id));
}

export function PriceTag({ series, sx }) {
  const { owns } = useDramaAuth();
  const visible = usePriceTagVisible(series);
  if (!visible) return null;
  const mine = owns(series.id);

  return (
    <Box
      component="span"
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
        px: 0.9,
        py: 0.35,
        borderRadius: 1,
        fontSize: 11,
        fontWeight: 800,
        lineHeight: 1.3,
        color: mine ? '#052e16' : C.ink,
        bgcolor: mine ? '#4ade80' : C.gold,
        boxShadow: '0 4px 14px -4px rgba(0,0,0,0.6)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.3,
        whiteSpace: 'nowrap',
        ...sx,
      }}
    >
      {mine ? (
        <>
          <Icon name="check" size={12} /> Таных
        </>
      ) : (
        formatPrice(priceOf(series))
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

export function PosterCard({ series, progressEp, width }) {
  const showPrice = usePriceTagVisible(series);
  const href = progressEp ? `/drama/${series.id}/${progressEp}` : `/drama/${series.id}`;

  return (
    <Box
      component={RouterLink}
      href={href}
      sx={{
        display: 'block',
        width: width ?? 1,
        flexShrink: 0,
        color: C.text,
        textDecoration: 'none',
        scrollSnapAlign: 'start',
        '& .poster': { transition: 'transform 450ms cubic-bezier(.2,.8,.2,1), box-shadow 450ms ease' },
        '& .poster img': { transition: 'transform 900ms cubic-bezier(.2,.8,.2,1), filter 450ms ease' },
        '& .play': { transition: 'opacity 300ms ease, transform 300ms ease' },
        '@media (hover: hover)': {
          '&:hover .poster': { transform: 'translateY(-6px)', boxShadow: C.glow },
          '&:hover .poster img': { transform: 'scale(1.08)', filter: 'brightness(0.75)' },
          '&:hover .play': { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' },
        },
        '&:active .poster': { transform: 'scale(0.97)' },
        '&:focus-visible': { outline: 'none' },
        '&:focus-visible .poster': { boxShadow: `0 0 0 3px ${C.accent}` },
      }}
    >
      <Box
        className="poster"
        sx={{
          position: 'relative',
          aspectRatio: '3 / 4',
          borderRadius: 2.5,
          overflow: 'hidden',
          bgcolor: C.surface2,
          boxShadow: '0 10px 30px -12px rgba(0,0,0,0.8)',
        }}
      >
        <Box component="img" src={series.poster} alt={series.title} loading="lazy" sx={{ width: 1, height: 1, objectFit: 'cover' }} />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)' }} />
        {/* Дээд талын нимгэн гэрэл */}
        <Box sx={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }} />

        {/* Үнийн шошго баруун дээд буланд; хоёулаа байвал тэмдэг нь доор нь (давхцахгүй) */}
        {series.badge && <Badge sx={{ position: 'absolute', top: showPrice ? 36 : 8, left: 8, zIndex: 1 }}>{series.badge}</Badge>}
        <PriceTag series={series} />

        <Box
          className="play"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 52,
            height: 52,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.35)',
            opacity: 0,
            transform: 'translate(-50%,-50%) scale(0.7)',
          }}
        >
          <Icon name="play" size={22} sx={{ ml: 0.3 }} />
        </Box>

        <Box sx={{ position: 'absolute', left: 8, right: 8, bottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: C.gold }}>
            <Icon name="star" size={11} /> {series.rating}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'rgba(255,255,255,0.85)' }}>
            <Icon name="play" size={10} /> {series.views}
          </Box>
        </Box>

        {progressEp && (
          <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <Box sx={{ height: 1, width: `${Math.min(100, (progressEp / series.episodes) * 100)}%`, background: C.grad }} />
          </Box>
        )}
      </Box>
      <Box
        sx={{
          mt: 1.1,
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.3,
          letterSpacing: -0.1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {series.title}
      </Box>
      <Box sx={{ mt: 0.3, fontSize: 12, color: C.muted }}>
        {series.episodes === 1
          ? `Кино · ${series.genres[0] ?? ''}`
          : progressEp
            ? `${progressEp}-р анги / ${series.episodes}`
            : `${series.episodes} анги · ${series.genres[0] ?? ''}`}
      </Box>
    </Box>
  );
}

// Топ 10 — постерын хажууд том дугаар
export function RankCard({ series, rank }) {
  return (
    <Box
      component={RouterLink}
      href={`/drama/${series.id}`}
      sx={{
        flexShrink: 0,
        width: { xs: 'calc((100% - 12px) / 1.7)', sm: 230, md: 260 },
        display: 'flex',
        alignItems: 'flex-end',
        textDecoration: 'none',
        color: C.text,
        scrollSnapAlign: 'start',
        '& .poster': { transition: 'transform 450ms cubic-bezier(.2,.8,.2,1), box-shadow 450ms ease' },
        '@media (hover: hover)': { '&:hover .poster': { transform: 'translateY(-6px) rotate(-1deg)', boxShadow: C.glow } },
      }}
    >
      <Box
        aria-hidden
        sx={{
          fontSize: { xs: 110, md: 150 },
          fontWeight: 900,
          lineHeight: 0.78,
          letterSpacing: rank === 10 ? -14 : -4,
          color: C.bg,
          WebkitTextStroke: '2px rgba(255,255,255,0.55)',
          mr: rank === 10 ? -3.5 : -2,
          zIndex: 0,
          userSelect: 'none',
          fontFamily: FONT,
        }}
      >
        {rank}
      </Box>
      <Box className="poster" sx={{ position: 'relative', zIndex: 1, flex: 1, aspectRatio: '3 / 4', borderRadius: 2, overflow: 'hidden', bgcolor: C.surface2, boxShadow: '-12px 0 30px -8px rgba(0,0,0,0.9)' }}>
        <Box component="img" src={series.poster} alt={series.title} loading="lazy" sx={{ width: 1, height: 1, objectFit: 'cover' }} />
        <PriceTag series={series} />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 55%)' }} />
        <Box sx={{ position: 'absolute', left: 8, right: 8, bottom: 8, fontSize: 13, fontWeight: 800, lineHeight: 1.25 }}>{series.title}</Box>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function SectionTitle({ title, href, icon, subtitle }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: { xs: 1.75, md: 2.5 } }}>
      <Box>
        <Box
          component="h2"
          sx={{ m: 0, fontSize: { xs: 20, md: 26 }, fontWeight: 900, letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Box component="span" sx={{ width: 4, height: { xs: 20, md: 24 }, borderRadius: 2, background: C.grad, color: C.ink, flexShrink: 0 }} />
          {icon && <Icon name={icon} size={22} sx={{ color: C.accent2 }} />}
          {title}
        </Box>
        {subtitle && <Box sx={{ mt: 0.4, ml: 1.6, fontSize: 13, color: C.muted }}>{subtitle}</Box>}
      </Box>
      {href && (
        <Box
          component={RouterLink}
          href={href}
          sx={{
            flexShrink: 0,
            color: C.muted,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 0.3,
            '&:hover': { color: C.text },
          }}
        >
          Бүгд <Icon name="chevronRight" size={14} />
        </Box>
      )}
    </Box>
  );
}

export function HScroll({ children, gap }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: gap ?? { xs: 1.5, md: 2.25 },
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        scrollPaddingLeft: { xs: 16, md: 0 },
        mx: { xs: -2, md: 0 },
        px: { xs: 2, md: 0 },
        pt: 1,
        pb: 2,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {children}
    </Box>
  );
}

export function NotFoundState() {
  return (
    <Box sx={{ py: 12, px: 2, textAlign: 'center', color: C.muted }}>
      <Box sx={{ fontSize: 72, fontWeight: 900, letterSpacing: -3, background: C.grad, WebkitBackgroundClip: 'text', color: 'transparent' }}>404</Box>
      <Box sx={{ mt: 1, fontSize: 18, color: C.text, fontWeight: 800 }}>Энэ цуврал олдсонгүй</Box>
      <Box sx={{ mt: 0.5, fontSize: 14 }}>Устгагдсан эсвэл холбоос буруу байж магадгүй.</Box>
      <Box
        component={RouterLink}
        href="/drama"
        sx={{ display: 'inline-block', mt: 3, px: 3, py: 1.3, borderRadius: 6, background: C.grad, color: C.ink, fontWeight: 700, textDecoration: 'none' }}
      >
        Нүүр хуудас руу буцах
      </Box>
    </Box>
  );
}

export const cardWidth = { xs: 'calc((100% - 24px) / 2.5)', sm: 165, md: 190 };
