'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { C } from '../drama-ui';
import { Field, Notice } from './drama-login-view';
import { useDramaAuth, translateError } from '../drama-auth';

// ----------------------------------------------------------------------

function Card({ title, subtitle, children }) {
  return (
    <Box sx={{ minHeight: { xs: 'calc(100dvh - 120px)', md: 'calc(100dvh - 64px)' }, display: 'grid', placeItems: 'center', px: 2, py: 4 }}>
      <Box sx={{ width: 1, maxWidth: 400, p: { xs: 3, sm: 4 }, borderRadius: 4, bgcolor: C.surface, border: `1px solid ${C.line}` }}>
        <Box component="h1" sx={{ m: 0, fontSize: 22, fontWeight: 800 }}>
          {title}
        </Box>
        <Box sx={{ mt: 0.5, mb: 2.5, fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{subtitle}</Box>
        {children}
      </Box>
    </Box>
  );
}

const submitSx = {
  mt: 1,
  height: 50,
  width: 1,
  border: 0,
  borderRadius: 6,
  background: C.grad,
  color: '#fff',
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  '&:disabled': { opacity: 0.55, cursor: 'default' },
};

const linkSx = { display: 'block', mt: 2.5, textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.accent, textDecoration: 'none' };

// ----------------------------------------------------------------------
// 1. Имэйл оруулж холбоос авах

export function DramaForgotView() {
  const { configured, resetPassword } = useDramaAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Нууц үг сэргээх" subtitle="Бүртгэлтэй имэйлээ оруулаарай. Шинэ нууц үг тохируулах холбоос илгээнэ.">
      {sent ? (
        <Notice tone="ok">
          <b>{email}</b> хаяг руу холбоос илгээлээ. Имэйлээ (Spam хавтсыг ч) шалгаад холбоос дээр дарна уу.
        </Notice>
      ) : (
        <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 1.5 }}>
          {error && <Notice tone="error">{error}</Notice>}
          <Field label="Имэйл" type="email" value={email} onChange={setEmail} autoComplete="email" inputMode="email" placeholder="name@example.com" />
          <Box component="button" type="submit" disabled={busy || !configured || !email} sx={submitSx}>
            {busy ? 'Илгээж байна…' : 'Холбоос илгээх'}
          </Box>
        </Box>
      )}
      <Box component={RouterLink} href="/drama/login" sx={linkSx}>
        ← Нэвтрэх хуудас руу буцах
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------
// 2. Имэйлийн холбоосоор орж ирээд шинэ нууц үг тохируулах

export function DramaResetView() {
  const router = useRouter();
  const { user, loading, updatePassword } = useDramaAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Нууц үг хамгийн багадаа 6 тэмдэгт байна.');
    if (password !== confirm) return setError('Нууц үг таарахгүй байна.');
    setBusy(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => router.replace('/drama/my'), 1500);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  if (loading) return <Card title="Шалгаж байна…" subtitle="Түр хүлээнэ үү." />;

  if (!user) {
    return (
      <Card title="Холбоос хүчингүй" subtitle="Холбоосны хугацаа дууссан эсвэл аль хэдийн ашигласан байна.">
        <Box component={RouterLink} href="/drama/forgot" sx={{ ...submitSx, display: 'grid', placeItems: 'center', textDecoration: 'none' }}>
          Шинэ холбоос авах
        </Box>
      </Card>
    );
  }

  return (
    <Card title="Шинэ нууц үг" subtitle={`${user.email} бүртгэлийн шинэ нууц үгийг оруулна уу.`}>
      {done ? (
        <Notice tone="ok">Нууц үг амжилттай солигдлоо!</Notice>
      ) : (
        <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 1.5 }}>
          {error && <Notice tone="error">{error}</Notice>}
          <Field label="Шинэ нууц үг" type="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Хамгийн багадаа 6 тэмдэгт" />
          <Field label="Дахин оруулах" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          <Box component="button" type="submit" disabled={busy} sx={submitSx}>
            {busy ? 'Хадгалж байна…' : 'Хадгалах'}
          </Box>
        </Box>
      )}
    </Card>
  );
}
