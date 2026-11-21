import { redirect } from 'next/navigation';

// ----------------------------------------------------------------------
// Үндсэн хаяг (/) → 444 Кино.
// Хуучин Ench4nt нүүр хуудсыг буцаах бол доорх мөрүүдийг сэргээнэ:
//   import { Ench4ntHeroView } from 'src/sections/home/view';
//   export default function Page() { return <Ench4ntHeroView />; }

export default function Page() {
  redirect('/drama/');
}
