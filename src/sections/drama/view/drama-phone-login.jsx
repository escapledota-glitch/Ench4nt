'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';

import { C, Icon } from '../drama-ui';
import { useDramaAuth, translateError } from '../drama-auth';

// ----------------------------------------------------------------------
// Утасны дугаараар нэвтрэх (Verify.MN): хэрэглэгч өөрийн утаснаасаа
// 144773 руу код илгээнэ → бид 3 сек тутам шалгаж, баталгаажмагц нэвтрүүлнэ.
// ----------------------------------------------------------------------

const call = async (payload) => {
  const res = await fetch('/api/kino/phone/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Алдаа гарлаа. Дахин оролдоно уу.');
  return body;
};

// iPhone: sms:144773&body=… , Android: sms:144773?body=…
const smsLink = (to, text) => {
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return `sms:${to}${ios ? '&' : '?'}body=${encodeURIComponent(text)}`;
};

export function PhoneLogin({ onBack, onError }) {
  const { signInWithPhoneToken } = useDramaAuth();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null); // { ticket, shortcode, text, phone }
  const [state, setState] = useState('idle'); // idle | waiting | done | expired
  const timer = useRef(null);
  const checking = useRef(false);

  const begin = async (e) => {
    e?.preventDefault();
    onError('');
    const p = phone.replace(/\D/g, '');
    if (!/^[5-9]\d{7}$/.test(p)) {
      onError('Утасны дугаараа зөв оруулна уу (8 оронтой).');
      return;
    }
    setBusy(true);
    try {
      const s = await call({ action: 'start', phone: p });
      setSession(s);
      setState('waiting');
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const check = useCallback(async () => {
    if (!session || checking.current) return;
    checking.current = true;
    try {
      const r = await call({ action: 'check', ticket: session.ticket });
      if (r.status === 'VERIFIED' && r.tokenHash) {
        setState('done');
        await signInWithPhoneToken(r.tokenHash); // нэвтэрмэгц нэвтрэх хуудас өөрөө шилжүүлнэ
      } else if (r.status === 'EXPIRED') {
        setState('expired');
      }
    } catch (err) {
      onError(translateError(err));
    } finally {
      checking.current = false;
    }
  }, [session, signInWithPhoneToken, onError]);

  // 3 сек тутам шалгана; мессежийн аппаас буцаж ирэхэд шууд шалгана
  useEffect(() => {
    if (state !== 'waiting') return undefined;
    timer.current = setInterval(check, 3000);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [state, check]);

  const reset = () => {
    setSession(null);
    setState('idle');
    onError('');
  };

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      {state === 'idle' && (
        <Box component="form" onSubmit={begin} noValidate sx={{ display: 'grid', gap: 1.5 }}>
          <Box component="label" sx={{ display: 'block' }}>
            <Box sx={{ fontSize: 13, fontWeight: 600, mb: 0.6, color: C.muted }}>Утасны дугаар</Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: 52,
                borderRadius: 2,
                bgcolor: C.bg,
                border: `1px solid ${C.line}`,
                '&:focus-within': { borderColor: C.accent },
              }}
            >
              <Box
                sx={{
                  pl: 1.5,
                  pr: 1,
                  color: C.muted,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRight: `1px solid ${C.line}`,
                }}
              >
                +976
              </Box>
              <Box
                component="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, '').slice(0, 9))}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="9911 2233"
                autoFocus
                sx={{
                  flex: 1,
                  minWidth: 0,
                  height: 1,
                  px: 1.5,
                  border: 0,
                  outline: 0,
                  bgcolor: 'transparent',
                  color: C.text,
                  fontFamily: 'inherit',
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              />
            </Box>
          </Box>
          <GoldButton type="submit" disabled={busy}>
            {busy ? 'Түр хүлээнэ үү…' : 'Үргэлжлүүлэх'}
          </GoldButton>
        </Box>
      )}

      {session && state !== 'idle' && (
        <Box sx={{ textAlign: 'center' }}>
          {state === 'done' ? (
            <Box sx={{ py: 3, fontSize: 16, fontWeight: 700, color: C.gold }}>
              <Icon name="check" size={36} sx={{ mx: 'auto', mb: 1, display: 'block' }} />
              Баталгаажлаа! Нэвтэрч байна…
            </Box>
          ) : state === 'expired' ? (
            <Box sx={{ py: 2 }}>
              <Box sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}>Хугацаа дууссан байна</Box>
              <GoldButton onClick={reset}>Дахин оролдох</GoldButton>
            </Box>
          ) : (
            <>
              <Box sx={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>
                <b style={{ color: C.text }}>
                  {session.phone.slice(0, 4)} {session.phone.slice(4)}
                </b>{' '}
                дугаартай утаснаасаа доорх кодыг мессежээр илгээнэ үү
              </Box>

              <Box
                sx={{
                  my: 2,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: C.bg,
                  border: '1px solid rgba(212,175,106,0.35)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1,
                }}
              >
                <Box>
                  <Box sx={{ fontSize: 11, color: C.muted, mb: 0.3 }}>Хүлээн авагч</Box>
                  <Box sx={{ fontSize: 24, fontWeight: 900, letterSpacing: 1, color: C.gold }}>
                    {session.shortcode}
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ fontSize: 11, color: C.muted, mb: 0.3 }}>Мессеж</Box>
                  <Box sx={{ fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>{session.text}</Box>
                </Box>
              </Box>

              <GoldButton component="a" href={smsLink(session.shortcode, session.text)}>
                <Icon name="message" size={18} /> Мессеж илгээх
              </GoldButton>

              <Box
                sx={{
                  mt: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  fontSize: 13,
                  color: C.muted,
                }}
              >
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: `2px solid ${C.accent}`,
                    borderTopColor: 'transparent',
                    animation: 'kinoSpin 0.9s linear infinite',
                    '@keyframes kinoSpin': { to: { transform: 'rotate(360deg)' } },
                  }}
                />
                Мессеж хүлээж байна…
              </Box>
              <Box sx={{ mt: 1.5, fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
                Мессежийн төлбөр операторын үнээр (≈150₮). Хоёр SIM-тэй бол дээрх дугаартай SIM-ээс
                илгээнэ үү.
              </Box>
              <Box
                component="button"
                type="button"
                onClick={reset}
                sx={{
                  mt: 1.5,
                  border: 0,
                  bgcolor: 'transparent',
                  color: C.accent,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Дугаар солих
              </Box>
            </>
          )}
        </Box>
      )}

      <Box
        component="button"
        type="button"
        onClick={onBack}
        sx={{
          mt: 0.5,
          border: 0,
          bgcolor: 'transparent',
          color: C.muted,
          fontFamily: 'inherit',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ← Бусад аргаар нэвтрэх
      </Box>
    </Box>
  );
}

function GoldButton({ children, sx, ...props }) {
  return (
    <Box
      component="button"
      {...props}
      sx={{
        height: 50,
        width: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        border: 0,
        borderRadius: 6,
        background: C.grad,
        color: C.ink,
        fontFamily: 'inherit',
        fontWeight: 700,
        fontSize: 16,
        textDecoration: 'none',
        cursor: 'pointer',
        '&:disabled': { opacity: 0.55, cursor: 'default' },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
