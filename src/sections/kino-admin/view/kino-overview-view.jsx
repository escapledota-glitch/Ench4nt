'use client';

import { useState, useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PLANS, formatPrice } from 'src/sections/drama/drama-data';

import { getStats, errorText } from '../kino-api';

// ----------------------------------------------------------------------

// Сарын орлогын ойролцоо тооцоо (идэвхтэй багцаас)
const MONTHLY = { week: (3900 * 30) / 7, month: 9900, year: 79000 / 12 };

function StatCard({ title, value, sub, icon, color = 'primary' }) {
  return (
    <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={(theme) => ({
          width: 56,
          height: 56,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          color: theme.vars.palette[color].main,
          bgcolor: varAlpha(theme.vars.palette[color].mainChannel, 0.12),
        })}
      >
        <Iconify icon={icon} width={28} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
        <Typography variant="h4">{value}</Typography>
        {sub && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

export function KinoOverviewView() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(errorText(e)));
  }, []);

  const byPlan = stats?.by_plan ?? {};
  const mrr = Object.entries(byPlan).reduce((sum, [plan, n]) => sum + (MONTHLY[plan] ?? 0) * n, 0);
  const totalActive = stats?.active ?? 0;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="444 Кино — Самбар"
        links={[{ name: 'Самбар', href: '/dashboard' }, { name: '444 Кино' }]}
        action={
          <Button variant="contained" href="/dashboard/kino/series/new" startIcon={<Iconify icon="mingcute:add-line" />}>
            Шинэ цуврал
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {error && (
        <Card sx={{ p: 3, mb: 3, color: 'error.main' }}>
          <Typography>{error}</Typography>
        </Card>
      )}

      {!stats && !error && <LinearProgress sx={{ mb: 3 }} />}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' } }}>
        <StatCard title="Нийт хэрэглэгч" value={stats?.users ?? '—'} sub={stats ? `Сүүлийн 7 хоногт +${stats.users_7d}` : ''} icon="solar:users-group-rounded-bold-duotone" />
        <StatCard title="Идэвхтэй багц" value={stats?.active ?? '—'} sub={stats?.users ? `Хэрэглэгчдийн ${Math.round((totalActive / stats.users) * 100)}%` : ''} icon="solar:crown-bold-duotone" color="warning" />
        <StatCard title="Сарын орлого (тооцоо)" value={stats ? formatPrice(Math.round(mrr)) : '—'} sub="Идэвхтэй багцаас тооцсон" icon="solar:wallet-money-bold-duotone" color="success" />
        <StatCard
          title="Худалдаж авсан кино"
          value={stats ? formatPrice(stats.purchases_revenue ?? 0) : '—'}
          sub={stats ? `${stats.purchases ?? 0} худалдан авалт · 7 хоногт +${stats.purchases_7d ?? 0}` : ''}
          icon="solar:tag-price-bold-duotone"
          color="warning"
        />
        <StatCard title="Цуврал" value={stats?.series ?? '—'} icon="solar:clapperboard-play-bold-duotone" color="secondary" />
        <StatCard title="7 хоногт үзсэн хэрэглэгч" value={stats?.watching_7d ?? '—'} icon="solar:play-circle-bold-duotone" color="info" />
        <StatCard title="Мэдэгдэл авдаг төхөөрөмж" value={stats?.push ?? '—'} icon="solar:bell-bing-bold-duotone" color="error" />
      </Box>

      <Box sx={{ mt: 3, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2.5 }}>
            Багцын хуваарилалт
          </Typography>
          <Stack spacing={2.5}>
            {PLANS.map((p) => {
              const n = byPlan[p.id] ?? 0;
              return (
                <Box key={p.id}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography variant="subtitle2">
                      {p.name} · {formatPrice(p.price)}
                    </Typography>
                    <Typography variant="subtitle2">{n}</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={totalActive ? (n / totalActive) * 100 : 0} sx={{ height: 8, borderRadius: 1 }} />
                </Box>
              );
            })}
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Шуурхай үйлдэл
          </Typography>
          <Stack spacing={1.5}>
            {[
              ['Цуврал, анги удирдах', '/dashboard/kino/series', 'solar:clapperboard-edit-bold-duotone'],
              ['Хэрэглэгч, багц удирдах', '/dashboard/kino/users', 'solar:user-id-bold-duotone'],
              ['Мэдэгдэл илгээх', '/dashboard/kino/notifications', 'solar:bell-bing-bold-duotone'],
              ['Сайтыг харах', '/drama', 'solar:eye-bold-duotone'],
            ].map(([label, href, icon]) => (
              <Button key={href} href={href} variant="outlined" color="inherit" size="large" startIcon={<Iconify icon={icon} />} sx={{ justifyContent: 'flex-start' }}>
                {label}
              </Button>
            ))}
          </Stack>
        </Card>
      </Box>
    </DashboardContent>
  );
}
