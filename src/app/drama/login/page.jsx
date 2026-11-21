import { Suspense } from 'react';

import { DramaLoginView } from 'src/sections/drama/view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Нэвтрэх — 444 Кино' };

export default function Page() {
  return (
    <Suspense>
      <DramaLoginView />
    </Suspense>
  );
}
