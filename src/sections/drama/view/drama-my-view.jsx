'use client';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { planName } from '../drama-data';
import { useCatalog } from '../drama-catalog';
import { useDramaStore } from '../use-drama-store';
import { PushCard, InstallCard } from '../drama-extras';
import { C, Icon, PosterCard, SectionTitle } from '../drama-ui';
import { useIsAdmin, formatDate, useDramaAuth } from '../drama-auth';

// ----------------------------------------------------------------------

const grid = {
  display: 'grid',
  gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' },
  gap: { xs: 1.25, md: 2 },
  rowGap: { xs: 2.5, md: 3 },
};

export function DramaMyView() {
  const { continueList, saved } = useDramaStore();
  const { getSeries } = useCatalog();

  const watching = continueList.map((h) => ({ series: getSeries(h.id), ep: h.ep })).filter((h) => h.series);
  const savedList = saved.map((id) => getSeries(id)).filter(Boolean);

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 6 }}>
      <AccountCard />

      <Box sx={{ mt: 2, display: 'grid', gap: 1.2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <InstallCard />
        <PushCard />
      </Box>

      <Box sx={{ mt: 4 }}>
        <SectionTitle title="Үргэлжлүүлэн үзэх" />
        {watching.length ? (
          <Box sx={grid}>
            {watching.map(({ series, ep }) => (
              <PosterCard key={series.id} series={series} progressEp={ep} />
            ))}
          </Box>
        ) : (
          <Empty text="Та одоогоор юу ч үзээгүй байна." />
        )}
      </Box>

      <Box sx={{ mt: 4 }}>
        <SectionTitle title="Хадгалсан" />
        {savedList.length ? (
          <Box sx={grid}>
            {savedList.map((s) => (
              <PosterCard key={s.id} series={s} />
            ))}
          </Box>
        ) : (
          <Empty text="♥ товч дарж дуртай цувралаа хадгалаарай." />
        )}
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

const btn = {
  px: 2.5,
  height: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.8,
  borderRadius: 6,
  fontWeight: 700,
  fontSize: 14,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

function AccountCard() {
  const { configured, loading, user, displayName, subscription, isSubscribed, signOut } = useDramaAuth();
  const isAdmin = useIsAdmin();

  const card = {
    p: { xs: 2.5, md: 3 },
    borderRadius: 4,
    background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(236,72,153,0.18))',
    border: `1px solid ${C.line}`,
  };

  if (configured && loading) return <Box sx={{ ...card, height: 120 }} />;

  if (!user) {
    return (
      <Box sx={{ ...card, textAlign: { xs: 'center', sm: 'left' }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: C.surface2, display: 'grid', placeItems: 'center', color: C.muted }}>
          <Icon name="user" size={28} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ fontSize: 18, fontWeight: 800 }}>Нэвтрээгүй байна</Box>
          <Box sx={{ mt: 0.3, fontSize: 14, color: C.muted }}>Нэвтэрч багцаа идэвхжүүлээд бүх ангийг үзээрэй.</Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: 1, sm: 'auto' } }}>
          <Box component={RouterLink} href="/drama/login" sx={{ ...btn, flex: 1, background: C.grad, color: '#fff' }}>
            Нэвтрэх
          </Box>
          <Box component={RouterLink} href="/drama/login?mode=register" sx={{ ...btn, flex: 1, bgcolor: 'rgba(255,255,255,0.1)', color: C.text }}>
            Бүртгүүлэх
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={card}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: C.grad,
            display: 'grid',
            placeItems: 'center',
            fontSize: 22,
            fontWeight: 900,
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {displayName.charAt(0)}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ fontSize: 18, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</Box>
          <Box sx={{ fontSize: 13, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</Box>
        </Box>
        <Box
          component="button"
          onClick={signOut}
          aria-label="Гарах"
          sx={{ ...btn, px: { xs: 1.2, sm: 2 }, border: `1px solid ${C.line}`, bgcolor: 'transparent', color: C.muted, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          <Icon name="logout" size={18} />
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Гарах
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 2.5,
          p: 2,
          borderRadius: 3,
          bgcolor: 'rgba(11,7,18,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Icon name="crown" size={24} sx={{ color: isSubscribed ? C.gold : C.muted }} />
          <Box>
            <Box sx={{ fontWeight: 700 }}>{isSubscribed ? `Premium · ${planName(subscription.plan)}` : 'Үнэгүй хэрэглэгч'}</Box>
            <Box sx={{ fontSize: 13, color: C.muted }}>
              {isSubscribed
                ? `${formatDate(subscription.expires_at)} хүртэл идэвхтэй`
                : subscription
                  ? `Багц ${formatDate(subscription.expires_at)}-нд дууссан`
                  : 'Цуврал бүрийн эхний ангиуд л нээлттэй'}
            </Box>
          </Box>
        </Box>
        <Box component={RouterLink} href="/drama/plans" sx={{ ...btn, background: isSubscribed ? 'rgba(255,255,255,0.1)' : C.grad, color: '#fff' }}>
          {isSubscribed ? 'Сунгах' : 'Багц авах'}
        </Box>
      </Box>

      {isAdmin && (
        <Box
          component="a"
          href="/dashboard/kino"
          sx={{ ...btn, mt: 1.5, width: 1, bgcolor: 'rgba(11,7,18,0.55)', color: C.gold, border: `1px solid rgba(251,191,36,0.3)` }}
        >
          <Icon name="shield" size={18} /> Админ самбар
        </Box>
      )}
    </Box>
  );
}

function Empty({ text }) {
  return (
    <Box sx={{ py: 5, textAlign: 'center', color: C.muted, bgcolor: C.surface, borderRadius: 3, fontSize: 14 }}>
      {text}
      <Box component={RouterLink} href="/drama" sx={{ display: 'block', mt: 1.5, color: C.accent, fontWeight: 600, textDecoration: 'none' }}>
        Үзэх зүйл хайх →
      </Box>
    </Box>
  );
}
