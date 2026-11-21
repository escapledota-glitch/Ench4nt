import { SERIES, getSeries } from './drama-data';

// ----------------------------------------------------------------------
// Сервер талд (хуудасны гарчиг, Facebook-ийн preview) цувралын мэдээлэл авах.
// Supabase холбоогүй эсвэл олдохгүй бол жишээ өгөгдлөөс хайна.
// ----------------------------------------------------------------------

export async function fetchSeriesMeta(id) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      const res = await fetch(
        `${url}/rest/v1/series?id=eq.${encodeURIComponent(id)}&select=id,title,description,poster,backdrop,episodes`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 300 } }
      );
      if (res.ok) {
        const [row] = await res.json();
        if (row) return row;
      }
    } catch {
      // сүлжээний алдаа — доорх жишээ өгөгдөл рүү
    }
  }
  return getSeries(id, SERIES);
}

export function seriesMetadata(series, suffix = '') {
  if (!series) return { title: '444 Кино' };
  const title = `${series.title}${suffix} — 444 Кино`;
  const image = series.backdrop || series.poster;
  return {
    title,
    description: series.description,
    openGraph: { title, description: series.description, images: image ? [image] : [], type: 'video.tv_show' },
    twitter: { card: 'summary_large_image', title, description: series.description, images: image ? [image] : [] },
  };
}
