import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const navData = [
  { title: 'Нүүр', path: '/', icon: <Iconify width={22} icon="solar:home-angle-bold-duotone" /> },
  { title: 'Дэлгүүр', path: paths.product.root, icon: <Iconify width={22} icon="solar:bag-bold-duotone" /> },
  { title: 'Загвар бүтээх', path: '/customizer', icon: <Iconify width={22} icon="solar:pen-bold-duotone" /> },
  { title: 'Төлбөр тооцоо', path: paths.product.checkout, icon: <Iconify width={22} icon="solar:cart-bold-duotone" /> },
  { title: 'Хяналтын самбар', path: CONFIG.auth.redirectPath, icon: <Iconify width={22} icon="solar:widget-bold-duotone" /> },
];
