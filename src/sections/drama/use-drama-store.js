'use client';

import { useCallback, useSyncExternalStore } from 'react';

// ----------------------------------------------------------------------
// Үзсэн түүх ба хадгалсан цуврал.
// Хөтөч дээр (localStorage) хадгалагдана. Нэвтэрсэн үед drama-sync.jsx
// бүртгэлтэй синк хийж, бүх төхөөрөмж дээр ижил харагдана.
// ----------------------------------------------------------------------

const KEY = 'kino444';
const EMPTY = { history: {}, saved: [] };

let state = EMPTY;
let loaded = false;
let remote = null; // { onWatch(seriesId, ep), onSave(seriesId, isSaved) }
const listeners = new Set();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    // хадгалах сан ашиглах боломжгүй — санах ойд л ажиллана
  }
}

function setState(updater) {
  load();
  state = updater(state);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => {
  load();
  return state;
};
const getServerSnapshot = () => EMPTY;

// ---------- Синк хийхэд ашиглах (drama-sync.jsx) ----------

export const storeApi = {
  get: getSnapshot,
  replace: (next) => setState(() => ({ ...EMPTY, ...next })),
  clear: () => setState(() => EMPTY),
  setRemote: (r) => {
    remote = r;
  },
};

// ----------------------------------------------------------------------

export function useDramaStore() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const recordWatch = useCallback((seriesId, ep) => {
    setState((s) => ({ ...s, history: { ...s.history, [seriesId]: { ep, at: Date.now() } } }));
    remote?.onWatch(seriesId, ep);
  }, []);

  const toggleSaved = useCallback((seriesId) => {
    const willSave = !getSnapshot().saved.includes(seriesId);
    setState((s) => ({
      ...s,
      saved: willSave ? [seriesId, ...s.saved] : s.saved.filter((id) => id !== seriesId),
    }));
    remote?.onSave(seriesId, willSave);
  }, []);

  const continueList = Object.entries(store.history)
    .sort((a, b) => b[1].at - a[1].at)
    .map(([id, v]) => ({ id, ep: v.ep }));

  return { ...store, continueList, recordWatch, toggleSaved };
}
