'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { DramaSync } from './drama-sync';
import { C, FONT, Icon } from './drama-ui';
import { CatalogProvider } from './drama-catalog';
import { NotificationBell } from './drama-extras';
import { useDramaAuth, DramaAuthProvider } from './drama-auth';
import { linkPushToUser, registerServiceWorker } from './drama-pwa';

// ----------------------------------------------------------------------

const NAV = [
  { label: 'Нүүр', href: '/drama', icon: 'home' },
  { label: 'Ангилал', href: '/drama/browse', icon: 'grid' },
  { label: 'Багц', href: '/drama/plans', icon: 'crown' },
  { label: 'Миний', href: '/drama/my', icon: 'user' },
];

const norm = (p) => (p.length > 1 ? p.replace(/\/$/, '') : p);

export function DramaLayout({ children }) {
  const pathname = norm(usePathname() ?? '');
  // /drama/[id]/[ep] — бүтэн дэлгэцийн тоглуулагч
  const isPlayer = pathname.split('/').filter(Boolean).length === 3 && !pathname.startsWith('/drama/browse');

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <DramaAuthProvider>
      <CatalogProvider>
        <DramaSync />
        <PushLinker />
        <Box
          sx={{
            minHeight: '100dvh',
            bgcolor: C.bg,
            color: C.text,
            fontFamily: FONT,
            WebkitFontSmoothing: 'antialiased',
            pb: isPlayer ? 0 : { xs: 'calc(64px + env(safe-area-inset-bottom, 0px))', md: 0 },
            '& ::selection': { bgcolor: 'rgba(168,85,247,0.45)' },
          }}
        >
          {!isPlayer && <Header pathname={pathname} />}
          <main>{children}</main>
          {!isPlayer && <Footer />}
          {!isPlayer && <BottomNav pathname={pathname} />}
        </Box>
      </CatalogProvider>
    </DramaAuthProvider>
  );
}

// Нэвтрэх үед энэ утасны мэдэгдлийн бүртгэлийг хэрэглэгчтэй холбоно
function PushLinker() {
  const { user } = useDramaAuth();
  const uid = user?.id;
  useEffect(() => {
    if (uid) linkPushToUser();
  }, [uid]);
  return null;
}

// ----------------------------------------------------------------------

function Logo() {
  return (
    <Box
      component={RouterLink}
      href="/drama"
      sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: C.text }}
    >
      <Box
        sx={{
          px: 0.9,
          height: 30,
          borderRadius: 1.5,
          background: C.grad,
          display: 'grid',
          placeItems: 'center',
          fontWeight: 900,
          fontSize: 15,
          letterSpacing: 0.5,
          boxShadow: '0 0 18px rgba(168,85,247,0.55)',
        }}
      >
        444
      </Box>
      <Box sx={{ fontWeight: 900, fontSize: 19, letterSpacing: 0.3 }}>Кино</Box>
    </Box>
  );
}

function Account() {
  const { configured, loading, user, displayName, isSubscribed } = useDramaAuth();

  if (configured && loading) return <Box sx={{ width: 36 }} />;

  if (!user) {
    return (
      <Box
        component={RouterLink}
        href="/drama/login"
        sx={{
          px: 1.8,
          height: 36,
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 5,
          background: C.grad,
          color: '#fff',
          fontWeight: 700,
          fontSize: 14,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Нэвтрэх
      </Box>
    );
  }

  return (
    <Box
      component={RouterLink}
      href="/drama/my"
      title={displayName}
      sx={{ position: 'relative', display: 'block', textDecoration: 'none' }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: C.grad,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: 15,
          textTransform: 'uppercase',
        }}
      >
        {displayName.charAt(0)}
      </Box>
      {isSubscribed && (
        <Box
          sx={{
            position: 'absolute',
            right: -4,
            bottom: -4,
            width: 18,
            height: 18,
            borderRadius: '50%',
            bgcolor: C.gold,
            color: '#3b2600',
            display: 'grid',
            placeItems: 'center',
            border: `2px solid ${C.bg}`,
          }}
        >
          <Icon name="crown" size={10} />
        </Box>
      )}
    </Box>
  );
}

function Header({ pathname }) {
  // Нүүр хуудсанд дээд талдаа тунгалаг, гүйлгэхэд бараан болно
  const overHero = pathname === '/drama';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const clear = overHero && !scrolled;

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 'env(safe-area-inset-top, 0px)',
        zIndex: 20,
        transition: 'background-color 300ms ease, border-color 300ms ease, backdrop-filter 300ms ease',
        bgcolor: clear ? 'transparent' : 'rgba(7,5,11,0.82)',
        backgroundImage: clear ? 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' : 'none',
        backdropFilter: clear ? 'none' : 'blur(16px) saturate(1.4)',
        borderBottom: `1px solid ${clear ? 'transparent' : C.line}`,
      }}
    >
      <Box
        sx={{
          maxWidth: 1360,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          height: { xs: 56, md: 64 },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, md: 2.5 },
        }}
      >
        <Logo />

        <Box component="nav" sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Box
                key={item.href}
                component={RouterLink}
                href={item.href}
                sx={{
                  px: 1.5,
                  py: 0.8,
                  borderRadius: 1.5,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: active ? C.text : C.muted,
                  bgcolor: active ? C.surface2 : 'transparent',
                  '&:hover': { color: C.text },
                }}
              >
                {item.label}
              </Box>
            );
          })}
        </Box>

        <Box sx={{ flex: 1 }} />

        <Box
          component={RouterLink}
          href="/drama/browse"
          aria-label="Хайх"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: C.muted,
            textDecoration: 'none',
            bgcolor: { md: C.surface },
            border: { md: `1px solid ${C.line}` },
            borderRadius: 5,
            px: { md: 1.5 },
            py: { md: 0.8 },
            width: { md: 240 },
            fontSize: 14,
          }}
        >
          <Icon name="search" size={20} />
          <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
            Кино, цуврал хайх…
          </Box>
        </Box>

        <NotificationBell />
        <Account />
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

function Footer() {
  const links = [
    ['Нүүр', '/drama'],
    ['Ангилал', '/drama/browse'],
    ['Багц', '/drama/plans'],
    ['Миний жагсаалт', '/drama/my'],
    ['Мэдэгдэл', '/drama/notifications'],
  ];
  return (
    <Box component="footer" sx={{ borderTop: `1px solid ${C.line}`, mt: 4 }}>
      <Box
        sx={{
          maxWidth: 1360,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          py: { xs: 4, md: 6 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        <Box sx={{ maxWidth: 360 }}>
          <Logo />
          <Box sx={{ mt: 1.5, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            Монгол богино цуврал, кино — утсандаа хаанаас ч, хэзээ ч үзээрэй.
          </Box>
        </Box>
        <Box component="nav" sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, md: 3 }, alignContent: 'flex-start' }}>
          {links.map(([label, href]) => (
            <Box key={href} component={RouterLink} href={href} sx={{ color: C.muted, fontSize: 14, textDecoration: 'none', '&:hover': { color: C.text } }}>
              {label}
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ maxWidth: 1360, mx: 'auto', px: { xs: 2, md: 4 }, pb: 4, fontSize: 12, color: 'rgba(246,242,251,0.35)' }}>
        © {new Date().getFullYear()} 444 Кино. Бүх эрх хуулиар хамгаалагдсан.
      </Box>
    </Box>
  );
}

function BottomNav({ pathname }) {
  return (
    <Box
      component="nav"
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        pb: 'env(safe-area-inset-bottom, 0px)',
        bgcolor: 'rgba(7,5,11,0.92)',
        backdropFilter: 'blur(14px)',
        borderTop: `1px solid ${C.line}`,
      }}
    >
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Box
            key={item.href}
            component={RouterLink}
            href={item.href}
            sx={{
              flex: 1,
              height: 64,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.4,
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'none',
              color: active ? C.text : C.muted,
              '& svg': { color: active ? C.accent : 'inherit' },
            }}
          >
            <Icon name={item.icon} size={24} />
            {item.label}
          </Box>
        );
      })}
    </Box>
  );
}
