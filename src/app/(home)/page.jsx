import { CONFIG } from 'src/global-config';

import { Ench4ntHeroView } from 'src/sections/home/view';

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName}` };

export default function Page() {
  return <Ench4ntHeroView />;
}
