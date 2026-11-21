'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';

import { RouterLink } from 'src/routes/components';

import { C, Icon } from '../drama-ui';
import { formatDate, useDramaAuth, translateError } from '../drama-auth';
import { PLANS, planName, formatPrice, PLAN_BENEFITS, FREE_EPISODES } from '../drama-data';

// ----------------------------------------------------------------------

const safeNext = (v) => (v && v.startsWith('/drama') ? v : null);

export function DramaPlansView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));

  const { user, subscription, isSubscribed, startTestSubscription } = useDramaAuth();
  const [picked, setPicked] = useState(null);

  const choose = (plan) => {
    if (!user) {
      const back = `/drama/plans${next ? `?next=${encodeURIComponent(next)}` : ''}`;
      router.push(`/drama/login?mode=register&next=${encodeURIComponent(back)}`);
      return;
    }
    setPicked(plan);
  };

  return (
    <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, pt: { xs: 3, md: 6 }, pb: 6 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto' }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            px: 1.5,
            py: 0.5,
            borderRadius: 5,
            bgcolor: 'rgba(251,191,36,0.12)',
            color: C.gold,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <Icon name="crown" size={14} /> 444 Кино Premium
        </Box>
        <Box component="h1" sx={{ m: 0, mt: 1.5, fontSize: { xs: 26, md: 38 }, fontWeight: 900, lineHeight: 1.15 }}>
          Бүх цувралыг хязгааргүй үз
        </Box>
        <Box sx={{ mt: 1.2, color: C.muted, fontSize: { xs: 14, md: 16 }, lineHeight: 1.6 }}>
          Цуврал бүрийн эхний {FREE_EPISODES} анги үнэгүй. Багц авснаар бүх анги нээгдэнэ.
        </Box>
      </Box>

      {isSubscribed && (
        <Box
          sx={{
            mt: 3,
            mx: 'auto',
            maxWidth: 560,
            p: 2,
            borderRadius: 3,
            bgcolor: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            color: '#bbf7d0',
            fontSize: 14,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Icon name="check" size={20} />
          <span>
            Таны <b>{planName(subscription.plan)}</b> багц <b>{formatDate(subscription.expires_at)}</b> хүртэл идэвхтэй.
            Дахин авбал хугацаа нь сунгагдана.
          </span>
        </Box>
      )}

      <Box
        sx={{
          mt: { xs: 3, md: 5 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: { xs: 1.5, md: 2.5 },
          alignItems: 'stretch',
        }}
      >
        {PLANS.map((p) => (
          <Box
            key={p.id}
            sx={{
              position: 'relative',
              p: { xs: 2.5, md: 3 },
              borderRadius: 4,
              bgcolor: C.surface,
              border: p.popular ? '2px solid transparent' : `1px solid ${C.line}`,
              background: p.popular
                ? `linear-gradient(${C.surface}, ${C.surface}) padding-box, ${C.grad} border-box`
                : C.surface,
              display: 'flex',
              flexDirection: { xs: 'row', md: 'column' },
              alignItems: { xs: 'center', md: 'stretch' },
              gap: 2,
              order: { xs: p.popular ? -1 : 0, md: 0 },
            }}
          >
            {p.popular && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -11,
                  left: { xs: 16, md: '50%' },
                  transform: { md: 'translateX(-50%)' },
                  px: 1.2,
                  py: 0.3,
                  borderRadius: 5,
                  background: C.grad,
                  fontSize: 11,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                Санал болгож байна
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ fontSize: 15, fontWeight: 700 }}>{p.name}</Box>
              <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Box sx={{ fontSize: { xs: 24, md: 34 }, fontWeight: 900 }}>{formatPrice(p.price)}</Box>
                <Box sx={{ fontSize: 13, color: C.muted }}>/ {p.period}</Box>
              </Box>
              <Box sx={{ mt: 0.3, fontSize: 13, color: p.popular ? C.accent2 : C.muted }}>{p.note}</Box>
              <Box component="ul" sx={{ display: { xs: 'none', md: 'grid' }, gap: 1, listStyle: 'none', p: 0, m: 0, mt: 2.5 }}>
                {PLAN_BENEFITS.map((b) => (
                  <Box component="li" key={b} sx={{ display: 'flex', gap: 1, fontSize: 14, color: 'rgba(244,240,250,0.85)' }}>
                    <Icon name="check" size={18} sx={{ color: C.accent }} /> {b}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box
              component="button"
              onClick={() => choose(p)}
              sx={{
                flexShrink: 0,
                height: { xs: 44, md: 50 },
                px: { xs: 2.5, md: 0 },
                border: 0,
                borderRadius: 6,
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                color: '#fff',
                background: p.popular ? C.grad : C.surface2,
              }}
            >
              Сонгох
            </Box>
          </Box>
        ))}
      </Box>

      {/* Утсан дээр давуу талуудыг нэг удаа харуулна */}
      <Box component="ul" sx={{ display: { xs: 'grid', md: 'none' }, gap: 1.2, listStyle: 'none', p: 0, m: 0, mt: 3 }}>
        {PLAN_BENEFITS.map((b) => (
          <Box component="li" key={b} sx={{ display: 'flex', gap: 1, fontSize: 14, color: 'rgba(244,240,250,0.85)' }}>
            <Icon name="check" size={18} sx={{ color: C.accent }} /> {b}
          </Box>
        ))}
      </Box>

      <PayDialog
        plan={picked}
        onClose={() => setPicked(null)}
        onPay={startTestSubscription}
        next={next}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------
// ТУРШИЛТЫН төлбөр. QPay холбох үед энд нэхэмжлэх (QR) үүсгэж харуулна.

function PayDialog({ plan, onClose, onPay, next }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const close = () => {
    if (busy) return;
    setError('');
    setDone(null);
    onClose();
  };

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      setDone(await onPay(plan.id));
    } catch (err) {
      const msg = translateError(err);
      setError(
        /start_test_subscription|subscriptions/.test(msg)
          ? 'Өгөгдлийн сан бэлэн биш байна. supabase/schema.sql файлыг Supabase дээр ажиллуулна уу.'
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={!!plan}
      onClose={close}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: { sx: { bgcolor: C.surface, color: C.text, backgroundImage: 'none', borderRadius: 4, m: 2, width: 'calc(100% - 32px)' } },
      }}
    >
      {plan && (
        <Box sx={{ p: 3 }}>
          {done ? (
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 64, height: 64, mx: 'auto', borderRadius: '50%', bgcolor: 'rgba(34,197,94,0.15)', color: '#4ade80', display: 'grid', placeItems: 'center' }}>
                <Icon name="check" size={34} />
              </Box>
              <Box sx={{ mt: 2, fontSize: 20, fontWeight: 800 }}>Амжилттай!</Box>
              <Box sx={{ mt: 1, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
                Таны {plan.name} багц <b>{formatDate(done.expires_at)}</b> хүртэл идэвхтэй боллоо.
              </Box>
              <Box
                component={RouterLink}
                href={next ?? '/drama'}
                sx={{
                  mt: 3,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  borderRadius: 6,
                  background: C.grad,
                  color: '#fff',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <Icon name="play" size={18} /> {next ? 'Үргэлжлүүлэн үзэх' : 'Үзэж эхлэх'}
              </Box>
            </Box>
          ) : (
            <>
              <Box sx={{ fontSize: 18, fontWeight: 800 }}>Төлбөр төлөх</Box>
              <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: C.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Box sx={{ fontWeight: 700 }}>444 Кино — {plan.name}</Box>
                  <Box sx={{ fontSize: 12, color: C.muted }}>Бүх цуврал, бүх анги</Box>
                </Box>
                <Box sx={{ fontSize: 20, fontWeight: 900 }}>{formatPrice(plan.price)}</Box>
              </Box>

              <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(251,191,36,0.12)', color: '#fcd34d', fontSize: 13, lineHeight: 1.55 }}>
                Туршилтын горим: жинхэнэ мөнгө татахгүй. QPay холбогдсоны дараа энд QR код гарна.
              </Box>

              {error && (
                <Box role="alert" sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(239,68,68,0.12)', color: '#fca5a5', fontSize: 13 }}>
                  {error}
                </Box>
              )}

              <Box sx={{ mt: 2.5, display: 'flex', gap: 1 }}>
                <Box
                  component="button"
                  onClick={close}
                  sx={{ flex: 1, height: 48, border: `1px solid ${C.line}`, borderRadius: 6, bgcolor: 'transparent', color: C.text, fontFamily: 'inherit', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                >
                  Болих
                </Box>
                <Box
                  component="button"
                  onClick={pay}
                  disabled={busy}
                  sx={{
                    flex: 2,
                    height: 48,
                    border: 0,
                    borderRadius: 6,
                    background: C.grad,
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    '&:disabled': { opacity: 0.6 },
                  }}
                >
                  {busy ? 'Түр хүлээнэ үү…' : 'Төлөх (тест)'}
                </Box>
              </Box>
            </>
          )}
        </Box>
      )}
    </Dialog>
  );
}
