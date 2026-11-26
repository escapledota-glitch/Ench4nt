'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';

import { C, Icon } from '../drama-ui';
import { useDramaAuth, translateError } from '../drama-auth';

// ----------------------------------------------------------------------
// Утасны дугаараар нэвтрэх
//  • PIN-тэй дугаар → утасны дугаар + 4 оронтой PIN (SMS шаардлагагүй)
//  • Анх удаа / PIN мартсан → Verify.MN (хэрэглэгч 144773 руу код илгээнэ) → шинэ PIN сонгоно
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

const weakPin = (pin) =>
  /^(\d)\1{3}$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin);
const fmtPhone = (p) => `${p.slice(0, 4)} ${p.slice(4)}`;

export function PhoneLogin({ onBack, onError }) {
  const { signInWithPhoneToken } = useDramaAuth();

  // step: phone → pin | sms → setpin → confirm → done
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [session, setSession] = useState(null); // { ticket, shortcode, text }
  const [resetPin, setResetPin] = useState(false);
  const checking = useRef(false);

  const digits = phone.replace(/\D/g, '');

  const finish = useCallback(
    async (tokenHash) => {
      setStep('done');
      await signInWithPhoneToken(tokenHash); // нэвтэрмэгц нэвтрэх хуудас өөрөө шилжүүлнэ
    },
    [signInWithPhoneToken]
  );

  const fail = useCallback(
    (err) => {
      onError(translateError(err));
    },
    [onError]
  );

  // SMS баталгаажуулалт эхлүүлэх
  const startSms = async (reset) => {
    onError('');
    setBusy(true);
    try {
      const s = await call({ action: 'start', phone: digits });
      setSession(s);
      setResetPin(reset);
      setStep('sms');
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  // 1) Утасны дугаар → PIN-тэй бол PIN, үгүй бол SMS
  const submitPhone = async (e) => {
    e?.preventDefault();
    onError('');
    if (!/^[5-9]\d{7}$/.test(digits)) {
      onError('Утасны дугаараа зөв оруулна уу (8 оронтой).');
      return;
    }
    setBusy(true);
    try {
      const { hasPin } = await call({ action: 'lookup', phone: digits });
      setBusy(false);
      if (hasPin) {
        setPin('');
        setStep('pin');
      } else {
        await startSms(false);
      }
    } catch (err) {
      setBusy(false);
      fail(err);
    }
  };

  // 2a) PIN-ээр нэвтрэх
  const submitPin = useCallback(
    async (value) => {
      onError('');
      setBusy(true);
      try {
        const r = await call({ action: 'pin', phone: digits, pin: value });
        await finish(r.tokenHash);
      } catch (err) {
        setPin('');
        fail(err);
      } finally {
        setBusy(false);
      }
    },
    [digits, finish, fail, onError]
  );

  // 2b) SMS хүлээж байх үед 3 сек тутам шалгана
  const check = useCallback(async () => {
    if (!session || checking.current) return;
    checking.current = true;
    try {
      const r = await call({ action: 'check', ticket: session.ticket, resetPin });
      if (r.needsPin) {
        setNewPin('');
        setPin('');
        setStep('setpin');
      } else if (r.tokenHash) {
        await finish(r.tokenHash);
      } else if (r.status === 'EXPIRED') {
        setStep('expired');
      }
    } catch (err) {
      fail(err);
    } finally {
      checking.current = false;
    }
  }, [session, resetPin, finish, fail]);

  useEffect(() => {
    if (step !== 'sms') return undefined;
    const t = setInterval(check, 3000);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [step, check]);

  // 3) Шинэ PIN сонгох → дахин оруулж батлах
  const choosePin = (value) => {
    onError('');
    if (weakPin(value)) {
      onError('Хэт амархан PIN байна (1111, 1234 гэх мэт). Өөр код сонгоно уу.');
      setPin('');
      return;
    }
    setNewPin(value);
    setPin('');
    setStep('confirm');
  };

  const confirmPin = async (value) => {
    onError('');
    if (value !== newPin) {
      onError('PIN код таарахгүй байна. Дахин сонгоно уу.');
      setPin('');
      setNewPin('');
      setStep('setpin');
      return;
    }
    setBusy(true);
    try {
      const r = await call({ action: 'setPin', ticket: session.ticket, pin: value });
      await finish(r.tokenHash);
    } catch (err) {
      setPin('');
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  // 4 орон бөглөгдмөгц автоматаар илгээнэ
  const onPinChange = (v) => {
    setPin(v);
    if (v.length < 4 || busy) return;
    if (step === 'pin') submitPin(v);
    else if (step === 'setpin') choosePin(v);
    else if (step === 'confirm') confirmPin(v);
  };

  const restart = () => {
    setSession(null);
    setPin('');
    setNewPin('');
    setStep('phone');
    onError('');
  };

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      {step === 'phone' && (
        <Box component="form" onSubmit={submitPhone} noValidate sx={{ display: 'grid', gap: 1.5 }}>
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
          <Box sx={{ fontSize: 11.5, color: C.muted, textAlign: 'center', lineHeight: 1.5 }}>
            Анх удаа бол нэг удаа SMS-ээр баталгаажуулж, 4 оронтой PIN код сонгоно. Дараа нь зөвхөн
            дугаар + PIN.
          </Box>
        </Box>
      )}

      {(step === 'pin' || step === 'setpin' || step === 'confirm') && (
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ fontSize: 13, color: C.muted }}>
            <b style={{ color: C.text }}>{fmtPhone(digits)}</b>
          </Box>
          <Box sx={{ mt: 1, mb: 2, fontSize: 17, fontWeight: 800 }}>
            {step === 'pin'
              ? 'PIN кодоо оруулна уу'
              : step === 'setpin'
                ? '4 оронтой PIN код сонгоно уу'
                : 'PIN кодоо дахин оруулна уу'}
          </Box>
          <PinInput value={pin} onChange={onPinChange} disabled={busy} key={step} />
          {step === 'setpin' && (
            <Box sx={{ mt: 1.5, fontSize: 11.5, color: C.muted }}>
              Дараагийн удаа энэ кодоор SMS-гүйгээр нэвтэрнэ. Бусдад бүү хэлээрэй.
            </Box>
          )}
          {busy && <Box sx={{ mt: 1.5, fontSize: 13, color: C.muted }}>Түр хүлээнэ үү…</Box>}
          {step === 'pin' && (
            <Box
              component="button"
              type="button"
              disabled={busy}
              onClick={() => startSms(true)}
              sx={{
                mt: 2,
                border: 0,
                bgcolor: 'transparent',
                color: C.accent,
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              PIN мартсан? SMS-ээр нэвтрэх
            </Box>
          )}
        </Box>
      )}

      {step === 'sms' && session && (
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>
            <b style={{ color: C.text }}>{fmtPhone(digits)}</b> дугаартай утаснаасаа доорх кодыг
            мессежээр илгээнэ үү
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
        </Box>
      )}

      {step === 'expired' && (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Box sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}>Хугацаа дууссан байна</Box>
          <GoldButton onClick={restart}>Дахин оролдох</GoldButton>
        </Box>
      )}

      {step === 'done' && (
        <Box sx={{ py: 3, textAlign: 'center', fontSize: 16, fontWeight: 700, color: C.gold }}>
          <Icon name="check" size={36} sx={{ mx: 'auto', mb: 1, display: 'block' }} />
          Амжилттай! Нэвтэрч байна…
        </Box>
      )}

      {step !== 'done' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, mt: 0.5 }}>
          {step !== 'phone' && <TextButton onClick={restart}>Дугаар солих</TextButton>}
          <TextButton onClick={onBack} muted>
            ← Бусад аргаар
          </TextButton>
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

// 4 нүдтэй PIN оруулга (нэг далд input — утасны тоон гар шууд гарна)
function PinInput({ value, onChange, disabled }) {
  const ref = useRef(null);
  // Алдааны дараа (дахин идэвхжмэгц) гарыг шууд нээнэ
  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  return (
    <Box
      onClick={() => ref.current?.focus()}
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        gap: 1.5,
        cursor: 'text',
      }}
    >
      {[0, 1, 2, 3].map((i) => {
        const filled = i < value.length;
        const active = i === value.length && !disabled;
        return (
          <Box
            key={i}
            sx={{
              width: 56,
              height: 64,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: C.bg,
              border: `1.5px solid ${active ? C.accent : filled ? 'rgba(212,175,106,0.45)' : C.line}`,
              boxShadow: active ? '0 0 0 3px rgba(212,175,106,0.15)' : 'none',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
          >
            {filled && (
              <Box sx={{ width: 14, height: 14, borderRadius: '50%', background: C.grad }} />
            )}
          </Box>
        );
      })}
      <Box
        component="input"
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        type="tel"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="PIN код"
        maxLength={4}
        sx={{
          position: 'absolute',
          inset: 0,
          width: 1,
          height: 1,
          opacity: 0,
          border: 0,
          fontSize: 16, // iOS томруулахгүй
          caretColor: 'transparent',
        }}
      />
    </Box>
  );
}

function TextButton({ children, muted, ...props }) {
  return (
    <Box
      component="button"
      type="button"
      {...props}
      sx={{
        border: 0,
        p: 0,
        bgcolor: 'transparent',
        color: muted ? C.muted : C.accent,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {children}
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
