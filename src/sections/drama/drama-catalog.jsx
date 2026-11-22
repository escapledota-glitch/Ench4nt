'use client';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { supabase } from './drama-auth';
import { SERIES, fromDb, getSeries } from './drama-data';

// ----------------------------------------------------------------------
// Цувралын жагсаалт. Supabase холбогдсон бол өгөгдлийн сангаас,
// эс бөгөөс drama-data.js доторх жишээ цувралыг ашиглана.
// ----------------------------------------------------------------------

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [series, setSeries] = useState(supabase ? [] : SERIES);
  const [loading, setLoading] = useState(!!supabase);
  const [source, setSource] = useState(supabase ? 'db' : 'sample');

  const reload = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('published', true)
      .order('sort', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data?.length) {
      // Хүснэгт үүсээгүй эсвэл хоосон — жишээ өгөгдөл харуулна
      setSeries(SERIES);
      setSource('sample');
    } else {
      setSeries(data.map(fromDb));
      setSource('db');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(
    () => ({ series, loading, source, reload, getSeries: (id) => getSeries(id, series) }),
    [series, loading, source, reload]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}

// ----------------------------------------------------------------------
// Нэг ангийн видео холбоог серверээс авна (/api/kino/stream).
// Сервер үзэх эрхийг шалгаад богино хугацаатай, гарын үсэгтэй холбоос өгнө.
//
// Буцаах: { loading, url, mode }  mode: 'full' | 'preview' | 'locked' | 'none' | 'fallback'
//   'none'     — энэ ангид видео оруулаагүй
//   'fallback' — сервер тохируулаагүй (жишээ өгөгдөлд л ажиллана)

export function useStreamUrl(seriesId, ep, refreshKey, adminToken) {
  const [state, setState] = useState({ loading: true, url: null, mode: null, key: null });
  const key = `${seriesId}:${ep}`;

  useEffect(() => {
    if (!seriesId || !ep) return undefined;
    let alive = true;
    // Өөр анги бол цэвэрлэнэ. Ижил ангийг дахин шалгаж байгаа бол одоогийн
    // видео, хадмалыг хэвээр үлдээнэ (тасрахгүй).
    setState((prev) => (prev.key === key && prev.url ? prev : { loading: true, url: null, mode: null, key }));

    (async () => {
      try {
        const session = supabase ? (await supabase.auth.getSession()).data.session : null;
        const res = await fetch('/api/kino/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
            ...(adminToken ? { "x-admin-token": adminToken } : {}),
          },
          body: JSON.stringify({ seriesId, ep }),
        });
        const body = await res.json().catch(() => ({}));
        if (!alive) return;
        // Сервер түр алдаа өгвөл (5xx) одоо тоглож буйг тасалдуулахгүй
        if (res.status >= 500 && res.status !== 503) {
          setState((prev) => (prev.key === key && prev.url ? { ...prev, loading: false } : { loading: false, url: null, mode: 'fallback', key }));
        } else if (res.status === 403) setState({ loading: false, url: null, mode: 'locked', key });
        else if (res.status === 503 || res.status === 404) setState({ loading: false, url: null, mode: 'fallback', key });
        else if (!body.url) setState({ loading: false, url: null, mode: 'none', key });
        else
          setState({
            loading: false,
            url: body.url,
            mode: body.mode,
            expires: body.expires,
            subtitles: body.subtitles ?? [],
            subtitleStyle: body.subtitleStyle ?? null,
            key,
          });
      } catch {
        // Сүлжээ түр тасарвал одоогийн видео, хадмалыг хэвээр үлдээнэ
        if (alive) setState((prev) => (prev.key === key && prev.url ? { ...prev, loading: false } : { loading: false, url: null, mode: 'fallback', key }));
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId, ep, refreshKey, adminToken]);

  return state;
}
