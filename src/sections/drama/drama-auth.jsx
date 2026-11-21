'use client';

import { createClient } from '@supabase/supabase-js';
import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

// ----------------------------------------------------------------------
// 444 Кино — нэвтрэлт ба захиалга (Supabase)
// Түлхүүрүүд: .env.local доторх NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
// ----------------------------------------------------------------------

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

const AuthContext = createContext(null);

const ERRORS = {
  'Invalid login credentials': 'Имэйл эсвэл нууц үг буруу байна.',
  'User already registered': 'Энэ имэйлээр бүртгэл үүссэн байна. Нэвтэрнэ үү.',
  'Email not confirmed': 'Имэйлээ баталгаажуулна уу. Таны имэйл рүү холбоос илгээсэн.',
  'Password should be at least 6 characters': 'Нууц үг хамгийн багадаа 6 тэмдэгт байна.',
  'Unable to validate email address: invalid format': 'Имэйл хаяг буруу байна.',
  'New password should be different from the old password': 'Шинэ нууц үг хуучнаасаа өөр байх ёстой.',
  'Auth session missing': 'Холбоосны хугацаа дууссан байна. Дахин илгээнэ үү.',
};

export function translateError(err) {
  if (!err) return '';
  const msg = err.message ?? String(err);
  const hit = Object.keys(ERRORS).find((k) => msg.includes(k));
  if (hit) return ERRORS[hit];
  if (/provider is not enabled|Unsupported provider/i.test(msg))
    return 'Энэ нэвтрэх арга одоогоор идэвхжээгүй байна.';
  if (/rate limit/i.test(msg)) return 'Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.';
  if (/fetch/i.test(msg)) return 'Сервертэй холбогдож чадсангүй. Интернэтээ шалгана уу.';
  return msg;
}

// ----------------------------------------------------------------------

export function DramaAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(!!supabase);

  const loadSubscription = useCallback(async (u) => {
    if (!supabase || !u) {
      setSubscription(null);
      return;
    }
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', u.id).maybeSingle();
    // Сүлжээний түр алдаа гарвал одоогийн багцыг хэвээр үлдээнэ
    // (үгүй бол үзэж байх үед багц "алга" болж видео/хадмал дахин ачаалагдана)
    if (error) return;
    setSubscription((prev) => (JSON.stringify(prev) === JSON.stringify(data ?? null) ? prev : (data ?? null)));
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      await loadSubscription(u);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      // Цаг тутмын токен шинэчлэлт (TOKEN_REFRESHED) — ижил хэрэглэгч бол юу ч өөрчлөхгүй
      setUser((prev) => (event !== 'USER_UPDATED' && prev && u && prev.id === u.id ? prev : u));
      // Supabase-ийн callback дотор шууд await хийхгүй
      setTimeout(() => loadSubscription(u), 0);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadSubscription]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
    // Имэйл баталгаажуулалт асаалттай бол session ирэхгүй
    return { needsConfirm: !data.session };
  }, []);

  // Google / Facebook. Нэвтэрсний дараа `next` хуудас руу буцаж ирнэ.
  const signInWithProvider = useCallback(async (provider, next = '/drama/my') => {
    const redirectTo = `${window.location.origin}/drama/login/?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) throw error;
  }, []);

  // Нууц үг сэргээх холбоос имэйлээр илгээнэ
  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/drama/reset/`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSubscription(null);
  }, []);

  const startTestSubscription = useCallback(async (plan) => {
    const { data, error } = await supabase.rpc('start_test_subscription', { p_plan: plan });
    if (error) throw error;
    setSubscription(data);
    return data;
  }, []);

  const value = useMemo(() => {
    const isSubscribed =
      !!subscription && subscription.status === 'active' && new Date(subscription.expires_at) > new Date();
    return {
      configured: !!supabase,
      loading,
      user,
      displayName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
      subscription,
      isSubscribed,
      signIn,
      signUp,
      signInWithProvider,
      resetPassword,
      updatePassword,
      signOut,
      startTestSubscription,
    };
  }, [loading, user, subscription, signIn, signUp, signInWithProvider, resetPassword, updatePassword, signOut, startTestSubscription]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useDramaAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useDramaAuth must be used inside DramaAuthProvider');
  return ctx;
}

// Нэвтэрсэн хэрэглэгч админ эсэх (null = шалгаж байна)
export function useIsAdmin() {
  const { user, loading } = useDramaAuth();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!supabase || !user) {
      setIsAdmin(false);
      return;
    }
    setIsAdmin(null);
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(!!data));
  }, [user, loading]);

  return isAdmin;
}

export function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
