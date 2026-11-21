import { DramaLayout } from 'src/sections/drama/drama-layout';

// ----------------------------------------------------------------------

export const viewport = { themeColor: '#0b0712', viewportFit: 'cover' };

export const metadata = {
  title: '444 Кино',
  applicationName: '444 Кино',
  manifest: '/kino/manifest.webmanifest',
  icons: {
    icon: [{ url: '/kino/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/kino/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: { capable: true, title: '444 Кино', statusBarStyle: 'black-translucent' },
  openGraph: { siteName: '444 Кино', locale: 'mn_MN' },
};

export default function Layout({ children }) {
  return <DramaLayout>{children}</DramaLayout>;
}
