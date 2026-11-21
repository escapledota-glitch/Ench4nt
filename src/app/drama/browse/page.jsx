import { Suspense } from 'react';

import { DramaBrowseView } from 'src/sections/drama/view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Ангилал — 444 Кино' };

export default function Page() {
  return (
    <Suspense>
      <DramaBrowseView />
    </Suspense>
  );
}
