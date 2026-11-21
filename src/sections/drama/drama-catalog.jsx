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

// Нэг цувралын ангиудын видео холбоос (RLS: түгжээтэй анги багцгүй бол ирэхгүй)
export function useEpisodeVideos(seriesId, refreshKey) {
  const [videos, setVideos] = useState({});

  useEffect(() => {
    if (!supabase || !seriesId) return undefined;
    let alive = true;
    supabase
      .from('episodes')
      .select('ep, video_url')
      .eq('series_id', seriesId)
      .then(({ data }) => {
        if (!alive || !data) return;
        setVideos(Object.fromEntries(data.map((r) => [r.ep, r.video_url])));
      });
    return () => {
      alive = false;
    };
  }, [seriesId, refreshKey]);

  return videos;
}
