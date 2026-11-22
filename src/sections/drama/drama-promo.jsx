'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { C, Icon } from './drama-ui';
import { useDramaAuth } from './drama-auth';
import { PLANS, formatPrice } from './drama-data';

// ----------------------------------------------------------------------
// Нүүр хуудсыг дундуур нь гүйлгэхэд гарч ирэх хямдралын цонх.
// Өдөрт нэг удаа, багцгүй хүнд л харагдана.
// ----------------------------------------------------------------------

const SEEN_KEY = 'kino444-promo-seen';
const today = () => new Date().toISOString().slice(0, 10);

export function PromoPopup() {
  const { loading, isSubscribed } = useDramaAuth();
  const [open, setOpen] = useState(false);

  const week = PLANS.find((p) => p.id === 'week');
  const month = PLANS.find((p) => p.id === 'month');

  useEffect(() => {
    if (loading || isSubscribed) return undefined;
    try {
      if (window.localStorage.getItem(SEEN_KEY) === today()) return undefined;
    } catch {
      // ignore
    }

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 400 && window.scrollY / max >= 0.45) {
        setOpen(true);
        try {
          window.localStorage.setItem(SEEN_KEY, today());
        } catch {
          // ignore
        }
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading, isSubscribed]);

  // Багц авсан бол хаана
  useEffect(() => {
    if (isSubscribed) setOpen(false);
  }, [isSubscribed]);

  if (!open || !week || !month) return null;

  const off = week.was ? Math.round((1 - week.price / week.was) * 100) : 0;

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Хямдрал"
      onClick={() => setOpen(false)}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        bgcolor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: { xs: 'flex-end', md: 'center' },
        justifyContent: 'center',
        p: { xs: 0, md: 3 },
        animation: 'promoFade 250ms ease',
        '@keyframes promoFade': { from: { opacity: 0 }, to: { opacity: 1 } },
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: 'relative',
          width: 1,
          maxWidth: 440,
          borderRadius: { xs: '24px 24px 0 0', md: 4 },
          overflow: 'hidden',
          bgcolor: C.surface,
          color: C.text,
          border: `1px solid ${C.line}`,
          boxShadow: '0 -20px 60px -20px rgba(168,85,247,0.6)',
          pb: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 20px)', md: 3 },
          animation: 'promoUp 420ms cubic-bezier(.2,.8,.2,1)',
          '@keyframes promoUp': { from: { transform: 'translateY(40px)', opacity: 0 }, to: { transform: 'none', opacity: 1 } },
        }}
      >
        {/* Дээд гэрэлтэй хэсэг */}
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2.5,
            background: 'radial-gradient(circle at 20% 0%, rgba(236,72,153,0.45), transparent 60%), radial-gradient(circle at 90% 20%, rgba(168,85,247,0.5), transparent 55%)',
          }}
        >
          <Box
            component="button"
            aria-label="Хаах"
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, border: 0, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.35)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            <Icon name="close" size={18} />
          </Box>

          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.4, borderRadius: 5, bgcolor: '#ef4444', fontSize: 12, fontWeight: 900, letterSpacing: 0.5 }}>
            <Icon name="fire" size={14} /> ХЯМДРАЛ −{off}%
          </Box>
          <Box sx={{ mt: 1.5, fontSize: 24, fontWeight: 900, lineHeight: 1.15, letterSpacing: -0.5 }}>
            Бүх цувралыг
            <br />
            хязгааргүй үз
          </Box>
          <Box sx={{ mt: 0.75, fontSize: 14, color: 'rgba(246,242,251,0.78)' }}>Багц аваад бүх кино, цувралын бүх ангийг үзээрэй.</Box>
        </Box>

        <Box sx={{ px: 3, display: 'grid', gap: 1.25 }}>
          {/* 7 хоног — хямдралтай */}
          <Box
            component={RouterLink}
            href="/drama/plans?plan=week"
            onClick={() => setOpen(false)}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 3,
              textDecoration: 'none',
              color: C.text,
              border: '2px solid transparent',
              background: `linear-gradient(${C.surface2}, ${C.surface2}) padding-box, ${C.grad} border-box`,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ fontWeight: 800, fontSize: 16 }}>{week.name}</Box>
              <Box sx={{ fontSize: 12, color: C.muted }}>Бүх цуврал, бүх анги</Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Box component="s" sx={{ fontSize: 13, color: C.muted, display: 'block' }}>
                {formatPrice(week.was)}
              </Box>
              <Box sx={{ fontSize: 22, fontWeight: 900, color: C.gold, lineHeight: 1.1 }}>{formatPrice(week.price)}</Box>
            </Box>
          </Box>

          {/* 1 сар */}
          <Box
            component={RouterLink}
            href="/drama/plans?plan=month"
            onClick={() => setOpen(false)}
            sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 3, textDecoration: 'none', color: C.text, bgcolor: C.surface2, border: `1px solid ${C.line}` }}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ fontWeight: 800, fontSize: 16 }}>{month.name}</Box>
              <Box sx={{ fontSize: 12, color: C.muted }}>Бүх цуврал хязгааргүй</Box>
            </Box>
            <Box sx={{ fontSize: 22, fontWeight: 900 }}>{formatPrice(month.price)}</Box>
          </Box>

          <Box
            component={RouterLink}
            href="/drama/plans?plan=week"
            onClick={() => setOpen(false)}
            sx={{
              mt: 0.5,
              height: 52,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              background: C.grad,
              color: '#fff',
              fontWeight: 800,
              fontSize: 16,
              textDecoration: 'none',
              boxShadow: '0 12px 30px -10px rgba(236,72,153,0.7)',
            }}
          >
            <Icon name="crown" size={20} /> {formatPrice(week.price)}-өөр эхлэх
          </Box>
          <Box
            component="button"
            onClick={() => setOpen(false)}
            sx={{ border: 0, bgcolor: 'transparent', color: C.muted, fontFamily: 'inherit', fontSize: 13, py: 1, cursor: 'pointer' }}
          >
            Дараа
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
