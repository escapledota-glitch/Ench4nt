import { DramaSeriesView } from 'src/sections/drama/view';
import { seriesMetadata, fetchSeriesMeta } from 'src/sections/drama/drama-server';

// ----------------------------------------------------------------------

export async function generateMetadata({ params }) {
  const { id } = await params;
  return seriesMetadata(await fetchSeriesMeta(id));
}

export default async function Page({ params }) {
  const { id } = await params;
  return <DramaSeriesView id={id} />;
}
