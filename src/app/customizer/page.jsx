import { CONFIG } from 'src/global-config';

import { CustomizerView } from 'src/sections/customizer/customizer-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Загвар бүтээх — ${CONFIG.appName}` };

export default function Page() {
  return <CustomizerView />;
}
