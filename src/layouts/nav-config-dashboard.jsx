import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  order: icon('ic-order'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  banking: icon('ic-banking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

export const navData = [
  /**
   * Ерөнхий
   */
  {
    subheader: 'Ерөнхий',
    items: [
      { title: 'Хяналтын самбар', path: paths.dashboard.root, icon: ICONS.dashboard },
      { title: 'Э-коммерц', path: paths.dashboard.general.ecommerce, icon: ICONS.ecommerce },
      { title: 'Аналитик', path: paths.dashboard.general.analytics, icon: ICONS.analytics },
      { title: 'Банк', path: paths.dashboard.general.banking, icon: ICONS.banking },
    ],
  },
  /**
   * Удирдлага
   */
  {
    subheader: 'Удирдлага',
    items: [
      {
        title: 'Хэрэглэгч',
        path: paths.dashboard.user.root,
        icon: ICONS.user,
        children: [
          { title: 'Профайл', path: paths.dashboard.user.root },
          { title: 'Жагсаалт', path: paths.dashboard.user.list },
          { title: 'Шинэ нэмэх', path: paths.dashboard.user.new },
          { title: 'Тохиргоо', path: paths.dashboard.user.account, deepMatch: true },
        ],
      },
      {
        title: 'Бүтээгдэхүүн',
        path: paths.dashboard.product.root,
        icon: ICONS.product,
        children: [
          { title: 'Жагсаалт', path: paths.dashboard.product.root },
          { title: 'Дэлгэрэнгүй', path: paths.dashboard.product.demo.details },
          { title: 'Шинэ нэмэх', path: paths.dashboard.product.new },
          { title: 'Засах', path: paths.dashboard.product.demo.edit },
        ],
      },
      {
        title: 'Захиалгууд',
        path: paths.dashboard.orders.root,
        icon: ICONS.order,
      },
      {
        title: 'Мокап зургууд',
        path: paths.dashboard.mockup.root,
        icon: ICONS.file,
      },
      {
        title: 'Захиалга',
        path: paths.dashboard.order.root,
        icon: ICONS.order,
        children: [
          { title: 'Жагсаалт', path: paths.dashboard.order.root },
          { title: 'Дэлгэрэнгүй', path: paths.dashboard.order.demo.details },
        ],
      },
      {
        title: 'Нэхэмжлэх',
        path: paths.dashboard.invoice.root,
        icon: ICONS.invoice,
        children: [
          { title: 'Жагсаалт', path: paths.dashboard.invoice.root },
          { title: 'Дэлгэрэнгүй', path: paths.dashboard.invoice.demo.details },
          { title: 'Шинэ нэмэх', path: paths.dashboard.invoice.new },
          { title: 'Засах', path: paths.dashboard.invoice.demo.edit },
        ],
      },
      {
        title: 'Блог',
        path: paths.dashboard.post.root,
        icon: ICONS.blog,
        children: [
          { title: 'Жагсаалт', path: paths.dashboard.post.root },
          { title: 'Дэлгэрэнгүй', path: paths.dashboard.post.demo.details },
          { title: 'Шинэ нэмэх', path: paths.dashboard.post.new },
          { title: 'Засах', path: paths.dashboard.post.demo.edit },
        ],
      },
      { title: 'Файл менежер', path: paths.dashboard.fileManager, icon: ICONS.folder },
      {
        title: 'Имэйл',
        path: paths.dashboard.mail,
        icon: ICONS.mail,
        info: (
          <Label color="error" variant="inverted">
            +32
          </Label>
        ),
      },
      { title: 'Чат', path: paths.dashboard.chat, icon: ICONS.chat },
      { title: 'Хуанли', path: paths.dashboard.calendar, icon: ICONS.calendar },
      { title: 'Канбан', path: paths.dashboard.kanban, icon: ICONS.kanban },
    ],
  },
];
