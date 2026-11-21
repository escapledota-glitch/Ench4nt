import { KinoSeriesEditView } from 'src/sections/kino-admin/view';

export const metadata = { title: 'Цуврал засах — 444 Кино админ' };

export default async function Page({ params }) {
  const { id } = await params;
  return <KinoSeriesEditView id={id} />;
}
