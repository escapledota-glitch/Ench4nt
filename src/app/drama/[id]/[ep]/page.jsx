import { notFound } from 'next/navigation';

import { DramaPlayerView } from 'src/sections/drama/view';
import { seriesMetadata, fetchSeriesMeta } from 'src/sections/drama/drama-server';

// ----------------------------------------------------------------------

export async function generateMetadata({ params }) {
  const { id, ep } = await params;
  return seriesMetadata(await fetchSeriesMeta(id), ` · ${ep}-р анги`);
}

export default async function Page({ params }) {
  const { id, ep } = await params;
  const n = Number.parseInt(ep, 10);

  if (!Number.isInteger(n) || n < 1) notFound();

  return <DramaPlayerView id={id} initialEp={n} />;
}
