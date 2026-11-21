'use client';

import { useRef, useEffect } from 'react';

import { storeApi } from './use-drama-store';
import { supabase, useDramaAuth } from './drama-auth';

// ----------------------------------------------------------------------
// Нэвтрэх үед: бүртгэл дээрх түүх + энэ төхөөрөмжийн түүхийг нэгтгэнэ.
// Нэвтэрсэн хойно: үзсэн/хадгалсан бүрийг шууд бүртгэлд хадгална.
// Гарах үед: энэ төхөөрөмж дээрх түүхийг цэвэрлэнэ.
// ----------------------------------------------------------------------

export function DramaSync() {
  const { user, loading } = useDramaAuth();
  const uid = user?.id ?? null;
  const prevUser = useRef(undefined);

  useEffect(() => {
    if (!supabase || loading) return undefined;

    const was = prevUser.current;
    prevUser.current = uid;

    if (!uid) {
      storeApi.setRemote(null);
      if (was) storeApi.clear(); // гарсан
      return undefined;
    }
    if (was === uid) return undefined;

    let cancelled = false;

    (async () => {
      const [{ data: hist, error: e1 }, { data: sav, error: e2 }] = await Promise.all([
        supabase.from('watch_history').select('series_id, ep, updated_at'),
        supabase.from('saved_series').select('series_id, created_at').order('created_at', { ascending: false }),
      ]);
      if (cancelled || e1 || e2) return; // хүснэгт үүсээгүй бол зөвхөн төхөөрөмж дээр ажиллана

      const local = storeApi.get();

      // Түүх: хамгийн сүүлд үзсэнийг авна
      const history = { ...local.history };
      const toUpload = [];
      const remoteMap = Object.fromEntries(hist.map((r) => [r.series_id, r]));
      hist.forEach((r) => {
        const at = new Date(r.updated_at).getTime();
        if (!history[r.series_id] || history[r.series_id].at < at) history[r.series_id] = { ep: r.ep, at };
      });
      Object.entries(local.history).forEach(([id, v]) => {
        const r = remoteMap[id];
        if (!r || new Date(r.updated_at).getTime() < v.at) {
          toUpload.push({ user_id: uid, series_id: id, ep: v.ep, updated_at: new Date(v.at).toISOString() });
        }
      });

      // Хадгалсан: нэгтгэнэ
      const remoteSaved = sav.map((r) => r.series_id);
      const saved = [...new Set([...remoteSaved, ...local.saved])];
      const savedUpload = local.saved.filter((id) => !remoteSaved.includes(id)).map((series_id) => ({ user_id: uid, series_id }));

      storeApi.replace({ history, saved });

      if (toUpload.length) await supabase.from('watch_history').upsert(toUpload);
      if (savedUpload.length) await supabase.from('saved_series').upsert(savedUpload);

      if (cancelled) return;
      storeApi.setRemote({
        onWatch: (series_id, ep) => {
          supabase.from('watch_history').upsert({ user_id: uid, series_id, ep, updated_at: new Date().toISOString() }).then(() => {});
        },
        onSave: (series_id, isSaved) => {
          const q = isSaved
            ? supabase.from('saved_series').upsert({ user_id: uid, series_id })
            : supabase.from('saved_series').delete().eq('series_id', series_id);
          q.then(() => {});
        },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, loading]);

  return null;
}
