import { Suspense } from 'react';

import { DramaPlansView } from 'src/sections/drama/view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Багц — 444 Кино' };

export default function Page() {
  return (
    <Suspense>
      <DramaPlansView />
    </Suspense>
  );
}
