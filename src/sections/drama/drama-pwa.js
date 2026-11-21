'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

import { supabase } from './drama-auth';

// ----------------------------------------------------------------------
// Утсанд суулгах (PWA) ба push мэдэгдэл
// ----------------------------------------------------------------------

const SW_URL = '/kino-sw.js';
const SW_SCOPE = '/drama/';
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// ---------- Service worker ----------

let swPromise = null;

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  if (!swPromise) {
    swPromise = navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE }).catch(() => null);
  }
  return swPromise;
}

// ---------- Суулгах ----------

let deferredPrompt = null;
let installed = false;
const installListeners = new Set();
const emit = () => installListeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  installed =
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    emit();
  });
}

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

function installSnapshot() {
  if (installed) return 'installed';
  if (deferredPrompt) return 'prompt'; // Android / Chrome / Edge
  if (isIOS()) return 'ios'; // Safari → Хуваалцах → Нүүр дэлгэцэнд нэмэх
  return 'unavailable';
}

export function useInstall() {
  const state = useSyncExternalStore(
    (l) => {
      installListeners.add(l);
      return () => installListeners.delete(l);
    },
    installSnapshot,
    () => 'unavailable'
  );

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    emit();
    return outcome === 'accepted';
  }, []);

  return { state, promptInstall };
}

// ---------- Push мэдэгдэл ----------

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID
  );
}

// 'unsupported' | 'ios-needs-install' | 'denied' | 'on' | 'off' | 'loading'
export function usePush() {
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!pushSupported()) {
      // iPhone дээр зөвхөн нүүр дэлгэцэнд суулгасан үед ажиллана
      setStatus(isIOS() && !installed ? 'ios-needs-install' : 'unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    const reg = await registerServiceWorker();
    const sub = await reg?.pushManager.getSubscription();
    setStatus(sub ? 'on' : 'off');
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'off');
        return false;
      }
      const reg = await registerServiceWorker();
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID) }));
      if (supabase) await supabase.rpc('save_push_subscription', { p_sub: sub.toJSON() });
      setStatus('on');
      return true;
    } catch {
      await refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await registerServiceWorker();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        if (supabase) await supabase.rpc('remove_push_subscription', { p_endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setStatus('off');
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, enable, disable };
}

// Нэвтэрсний дараа одоо байгаа push бүртгэлийг хэрэглэгчтэй холбоно
export async function linkPushToUser() {
  if (!pushSupported() || !supabase || Notification.permission !== 'granted') return;
  const reg = await registerServiceWorker();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await supabase.rpc('save_push_subscription', { p_sub: sub.toJSON() });
}
