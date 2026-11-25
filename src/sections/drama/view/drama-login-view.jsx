'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { KinoLogo } from 'src/components/kino-logo';

import { C, Icon } from '../drama-ui';
import { useDramaAuth, translateError } from '../drama-auth';

// ----------------------------------------------------------------------

// Зөвхөн сайтын доторх хаяг руу буцаана
const safeNext = (v) => (v && (v.startsWith('/drama') || v.startsWith('/dashboard/kino')) ? v : '/drama/my');

export function DramaLoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));

  const { configured, user, loading, signIn, signUp, signInWithProvider } = useDramaAuth();

  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  const social = async (provider) => {
    setError('');
    setBusy(true);
    try {
      await signInWithProvider(provider, next); // Google/Facebook хуудас руу шилжинэ
    } catch (err) {
      setError(translateError(err));
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (mode === 'register' && !name.trim()) return setError('Нэрээ оруулна уу.');
    if (password.length < 6) return setError('Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой.');

    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        const { needsConfirm } = await signUp(name.trim(), email.trim(), password);
        if (needsConfirm) {
          setInfo(`${email} хаяг руу баталгаажуулах холбоос илгээлээ. Имэйлээ шалгаад дахин нэвтэрнэ үү.`);
          setMode('login');
        }
      }
    } catch (err) {
      setError(translateError(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <Box sx={{ minHeight: { xs: 'calc(100dvh - 120px)', md: 'calc(100dvh - 64px)' }, display: 'grid', placeItems: 'center', px: 2, py: 4 }}>
      <Box
        sx={{
          width: 1,
          maxWidth: 400,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          bgcolor: C.surface,
          border: `1px solid ${C.line}`,
          boxShadow: '0 30px 80px -30px rgba(212,175,106,0.45)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <KinoLogo height={40} sx={{ mb: 2 }} />
          <Box component="h1" sx={{ m: 0, fontSize: 22, fontWeight: 800 }}>
            {mode === 'login' ? 'Тавтай морил' : 'Бүртгэл үүсгэх'}
          </Box>
          <Box sx={{ mt: 0.5, fontSize: 14, color: C.muted }}>
            {mode === 'login' ? '444 Кино-д нэвтэрнэ үү' : 'Үнэгүй бүртгүүлээд үзэж эхлээрэй'}
          </Box>
        </Box>

        {/* Таб */}
        <Box sx={{ display: 'flex', p: 0.5, borderRadius: 5, bgcolor: C.bg, mb: 2.5 }}>
          {[
            ['login', 'Нэвтрэх'],
            ['register', 'Бүртгүүлэх'],
          ].map(([key, label]) => (
            <Box
              key={key}
              component="button"
              type="button"
              onClick={() => {
                setMode(key);
                setError('');
              }}
              sx={{
                flex: 1,
                height: 40,
                border: 0,
                borderRadius: 5,
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                color: mode === key ? C.ink : C.muted,
                background: mode === key ? C.grad : 'transparent',
              }}
            >
              {label}
            </Box>
          ))}
        </Box>

        {!configured && (
          <Notice tone="warn">
            Supabase түлхүүр тохируулаагүй байна. <b>.env.local</b> файлд түлхүүрээ оруулаад серверээ дахин асаана уу.
          </Notice>
        )}
        {info && <Notice tone="ok">{info}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}

        <Box sx={{ display: 'grid', gap: 1.2 }}>
          <SocialButton provider="google" label="Google-ээр үргэлжлүүлэх" disabled={busy || !configured} onClick={() => social('google')} />
          <SocialButton provider="facebook" label="Facebook-ээр үргэлжлүүлэх" disabled={busy || !configured} onClick={() => social('facebook')} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2.5, color: C.muted, fontSize: 12 }}>
          <Box sx={{ flex: 1, height: '1px', bgcolor: C.line }} />
          эсвэл имэйлээр
          <Box sx={{ flex: 1, height: '1px', bgcolor: C.line }} />
        </Box>

        <Box component="form" onSubmit={submit} noValidate sx={{ display: 'grid', gap: 1.5 }}>
          {mode === 'register' && (
            <Field label="Нэр" value={name} onChange={setName} autoComplete="name" placeholder="Таны нэр" />
          )}
          <Field
            label="Имэйл"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            inputMode="email"
            placeholder="name@example.com"
          />
          <Field
            label="Нууц үг"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="Хамгийн багадаа 6 тэмдэгт"
            end={
              <Box
                component="button"
                type="button"
                onClick={() => setShowPw((v) => !v)}
                sx={{ border: 0, bgcolor: 'transparent', color: C.muted, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer', px: 1 }}
              >
                {showPw ? 'Нуух' : 'Харах'}
              </Box>
            }
          />

          {mode === 'login' && (
            <Box
              component={RouterLink}
              href="/drama/forgot"
              sx={{ justifySelf: 'end', mt: -0.5, fontSize: 13, fontWeight: 600, color: C.accent, textDecoration: 'none' }}
            >
              Нууц үгээ мартсан уу?
            </Box>
          )}

          <Box
            component="button"
            type="submit"
            disabled={busy || !configured}
            sx={{
              mt: 1,
              height: 50,
              border: 0,
              borderRadius: 6,
              background: C.grad,
              color: C.ink,
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              '&:disabled': { opacity: 0.55, cursor: 'default' },
            }}
          >
            {busy ? 'Түр хүлээнэ үү…' : mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
          </Box>
        </Box>

        <Box sx={{ mt: 2.5, textAlign: 'center', fontSize: 13, color: C.muted }}>
          {mode === 'login' ? 'Бүртгэлгүй юу? ' : 'Бүртгэлтэй юу? '}
          <Box
            component="button"
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            sx={{ border: 0, p: 0, bgcolor: 'transparent', color: C.accent, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {mode === 'login' ? 'Бүртгүүлэх' : 'Нэвтрэх'}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

const LOGOS = {
  google: (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  ),
  facebook: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#fff" d="M14 13.5h2.5l1-4H14v-2c0-1 0-2 2-2h1.5V2.1C17.2 2.1 15.9 2 14.6 2 11.9 2 10 3.7 10 6.7v2.8H7v4h3V22h4z" />
    </svg>
  ),
};

function SocialButton({ provider, label, onClick, disabled }) {
  const fb = provider === 'facebook';
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.2,
        borderRadius: 6,
        border: fb ? 0 : '1px solid #dadce0',
        bgcolor: fb ? '#1877F2' : '#fff',
        color: fb ? '#fff' : '#1f1f1f',
        fontFamily: 'inherit',
        fontWeight: 700,
        fontSize: 15,
        cursor: 'pointer',
        '&:disabled': { opacity: 0.55, cursor: 'default' },
      }}
    >
      {LOGOS[provider]}
      {label}
    </Box>
  );
}

export function Field({ label, value, onChange, end, ...input }) {
  return (
    <Box component="label" sx={{ display: 'block' }}>
      <Box sx={{ fontSize: 13, fontWeight: 600, mb: 0.6, color: C.muted }}>{label}</Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 48,
          borderRadius: 2,
          bgcolor: C.bg,
          border: `1px solid ${C.line}`,
          '&:focus-within': { borderColor: C.accent },
        }}
      >
        <Box
          component="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          {...input}
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
            fontSize: 16, // iOS дээр томруулахгүй
          }}
        />
        {end}
      </Box>
    </Box>
  );
}

export function Notice({ tone, children }) {
  const colors = {
    ok: ['rgba(34,197,94,0.12)', '#86efac'],
    warn: ['rgba(212,175,106,0.12)', '#e3c07a'],
    error: ['rgba(239,68,68,0.12)', '#fca5a5'],
  }[tone];
  return (
    <Box
      role={tone === 'error' ? 'alert' : 'status'}
      sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: colors[0], color: colors[1], fontSize: 13, lineHeight: 1.55, display: 'flex', gap: 1 }}
    >
      <Icon name={tone === 'ok' ? 'check' : 'close'} size={16} sx={{ mt: 0.2 }} />
      <span>{children}</span>
    </Box>
  );
}
