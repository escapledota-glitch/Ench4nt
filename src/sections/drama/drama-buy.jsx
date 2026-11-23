'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';

import { RouterLink } from 'src/routes/components';

import { C, Icon } from './drama-ui';
import { useDramaAuth } from './drama-auth';
import { PLANS, priceOf, isForSale, formatPrice } from './drama-data';

// ----------------------------------------------------------------------
// Кино тус бүрийг худалдаж авах
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function BuyButton({ series, sx, onBought }) {
  const [open, setOpen] = useState(false);
  const { canWatch } = useDramaAuth();
  if (!isForSale(series) || canWatch(series.id)) return null;

  return (
    <>
      <Box
        component="button"
        onClick={() => setOpen(true)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          px: 3,
          height: 50,
          border: 0,
          borderRadius: 1.5,
          bgcolor: C.gold,
          color: '#1a1200',
          fontFamily: 'inherit',
          fontWeight: 800,
          fontSize: 15,
          cursor: 'pointer',
          boxShadow: '0 10px 30px -10px rgba(251,191,36,0.7)',
          ...sx,
        }}
      >
        <Icon name="coin" size={20} /> {formatPrice(priceOf(series))} — Худалдаж авах
      </Box>
      <BuyDialog series={series} open={open} onClose={() => setOpen(false)} onBought={onBought} />
    </>
  );
}

export function BuyDialog({ series, open, onClose, onBought }) {
  const pathname = usePathname();
  const { user, buySeries } = useDramaAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const close = () => {
    if (busy) return;
    setError('');
    setDone(false);
    onClose();
  };

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      await buySeries(series.id);
      setDone(true);
      onBought?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const btn = {
    height: 50,
    border: 0,
    borderRadius: 1.5,
    fontFamily: 'inherit',
    fontWeight: 800,
    fontSize: 15,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    textDecoration: 'none',
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="xs"
      sx={{ zIndex: 1400 }}
      slotProps={{ paper: { sx: { bgcolor: C.surface, color: C.text, backgroundImage: 'none', borderRadius: 4, m: 2, width: 'calc(100% - 32px)' } } }}
    >
      {series && (
        <Box sx={{ p: 3 }}>
          {done ? (
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 64, height: 64, mx: 'auto', borderRadius: '50%', bgcolor: 'rgba(34,197,94,0.15)', color: '#4ade80', display: 'grid', placeItems: 'center' }}>
                <Icon name="check" size={34} />
              </Box>
              <Box sx={{ mt: 2, fontSize: 20, fontWeight: 800 }}>Амжилттай!</Box>
              <Box sx={{ mt: 1, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
                «{series.title}» одоо таных. Хэдэн ч удаа бүтэн үзэж болно.
              </Box>
              <Box component="button" onClick={close} sx={{ ...btn, mt: 3, width: 1, background: C.grad, color: '#fff' }}>
                <Icon name="play" size={18} /> Үзэх
              </Box>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box component="img" src={series.poster} alt="" sx={{ width: 64, aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ fontSize: 12, color: C.muted }}>Худалдаж авах</Box>
                  <Box sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1.25 }}>{series.title}</Box>
                  <Box sx={{ mt: 0.5, fontSize: 22, fontWeight: 900, color: C.gold }}>{formatPrice(priceOf(series))}</Box>
                </Box>
              </Box>

              <Box sx={{ mt: 2, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                Нэг удаа төлөөд энэ {series.episodes > 1 ? 'цувралын бүх ангийг' : 'киног'} хугацаагүй бүтэн үзнэ.
              </Box>

              {!user ? (
                <Box
                  component={RouterLink}
                  href={`/drama/login?next=${encodeURIComponent(pathname || '/drama')}`}
                  sx={{ ...btn, mt: 2.5, background: C.grad, color: '#fff' }}
                >
                  Худалдаж авахын тулд нэвтрэх
                </Box>
              ) : (
                <>
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(251,191,36,0.12)', color: '#fcd34d', fontSize: 13, lineHeight: 1.55 }}>
                    Туршилтын горим: жинхэнэ мөнгө татахгүй. QPay холбогдсоны дараа энд QR код гарна.
                  </Box>
                  {error && (
                    <Box role="alert" sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(239,68,68,0.12)', color: '#fca5a5', fontSize: 13 }}>
                      {error}
                    </Box>
                  )}
                  <Box sx={{ mt: 2.5, display: 'flex', gap: 1 }}>
                    <Box component="button" onClick={close} sx={{ ...btn, flex: 1, border: `1px solid ${C.line}`, bgcolor: 'transparent', color: C.text, fontWeight: 600 }}>
                      Болих
                    </Box>
                    <Box component="button" onClick={pay} disabled={busy} sx={{ ...btn, flex: 2, bgcolor: C.gold, color: '#1a1200', '&:disabled': { opacity: 0.6 } }}>
                      {busy ? 'Түр хүлээнэ үү…' : `${formatPrice(priceOf(series))} төлөх (тест)`}
                    </Box>
                  </Box>
                </>
              )}
            </>
          )}
        </Box>
      )}
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// Түгжээтэй ангийн дэлгэц дээрх сонголтууд: 7 хоног (хямдрал), 1 сар, энэ киног худалдаж авах
// ----------------------------------------------------------------------

const perDay = (price, days) => `${Math.round(price / days).toLocaleString('en-US')}₮`;

function OfferCard({ icon, tile, title, text, note, price, was, tag, tagBg, hero, ...props }) {
  return (
    <Box
      {...props}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: 1,
        p: 1.5,
        pr: 1.75,
        border: hero ? '1.5px solid transparent' : '1px solid rgba(255,255,255,0.14)',
        borderRadius: 2.5,
        // онцлох карт: ягаан-нил градиент хүрээ + гэрэлтэлт
        background: hero
          ? 'linear-gradient(#1a1024, #1a1024) padding-box, linear-gradient(135deg, #fbbf24, #ec4899 50%, #a855f7) border-box'
          : 'rgba(255,255,255,0.06)',
        boxShadow: hero ? '0 12px 40px -12px rgba(236,72,153,0.65)' : 'none',
        color: '#fff',
        fontFamily: 'inherit',
        textAlign: 'left',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'transform 120ms ease',
        '&:hover': { transform: 'translateY(-1px)' },
        '&:active': { transform: 'scale(0.98)' },
      }}
    >
      {tag && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            left: 14,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            background: tagBg,
            color: '#fff',
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
          }}
        >
          {tag}
        </Box>
      )}
      <Box
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 1.5,
          display: 'grid',
          placeItems: 'center',
          background: tile,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
        }}
      >
        <Icon name={icon} size={24} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ fontWeight: 800, fontSize: 15.5, lineHeight: 1.25 }}>{title}</Box>
        <Box sx={{ fontSize: 12, opacity: 0.72, lineHeight: 1.35, mt: 0.25 }}>{text}</Box>
        {note && <Box sx={{ fontSize: 11.5, fontWeight: 700, color: C.gold, mt: 0.4 }}>{note}</Box>}
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        {was && <Box sx={{ fontSize: 12, opacity: 0.5, textDecoration: 'line-through', lineHeight: 1.2 }}>{formatPrice(was)}</Box>}
        <Box sx={{ fontWeight: 900, fontSize: hero ? 20 : 16, color: hero ? '#fff' : C.gold, lineHeight: 1.2 }}>{formatPrice(price)}</Box>
      </Box>
    </Box>
  );
}

export function PaywallOffers({ series, backHere }) {
  const [open, setOpen] = useState(false);
  const { canWatch } = useDramaAuth();
  const week = PLANS.find((p) => p.id === 'week');
  const month = PLANS.find((p) => p.id === 'month');
  const canBuy = isForSale(series) && !canWatch(series.id);
  const off = week?.was ? Math.round((1 - week.price / week.was) * 100) : 0;

  return (
    <Box sx={{ width: 1, maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 1.75, mt: 0.5 }}>
      <Box sx={{ fontSize: 13, opacity: 0.7, textAlign: 'center', mb: 0.5 }}>Танд дараах багцуудыг санал болгож байна:</Box>
      {week && (
        <OfferCard
          component={RouterLink}
          href={`/drama/plans?plan=week&next=${backHere}`}
          hero
          tag={off ? `🔥 ${off}% хямдрал` : '🔥 Хямдрал'}
          tagBg="linear-gradient(90deg, #ef4444, #ec4899)"
          icon="fire"
          tile="linear-gradient(135deg, #f97316, #ec4899)"
          title="7 хоногийн багц"
          text="7 хоногийн турш бүх кино үнэгүй"
          note={`Өдөрт ердөө ${perDay(week.price, 7)}`}
          price={week.price}
          was={week.was}
        />
      )}
      {month && (
        <OfferCard
          component={RouterLink}
          href={`/drama/plans?plan=month&next=${backHere}`}
          tag="⭐ Хамгийн ашигтай"
          tagBg={C.grad}
          icon="crown"
          tile="linear-gradient(135deg, #fbbf24, #f59e0b)"
          title="1 сарын багц"
          text="Бүтэн сарын турш бүх кино үнэгүй"
          note={`Өдөрт ${perDay(month.price, 30)}`}
          price={month.price}
        />
      )}
      {canBuy && (
        <>
          <OfferCard
            component="button"
            type="button"
            onClick={() => setOpen(true)}
            icon="play"
            tile="linear-gradient(135deg, #6366f1, #a855f7)"
            title="Кино худалдан авах"
            text={`Сонгосон киногоо тусад нь ${priceOf(series).toLocaleString('en-US')} төгрөгөөр худалдан авч үзэх боломжтой`}
            price={priceOf(series)}
          />
          <BuyDialog series={series} open={open} onClose={() => setOpen(false)} />
        </>
      )}
    </Box>
  );
}
