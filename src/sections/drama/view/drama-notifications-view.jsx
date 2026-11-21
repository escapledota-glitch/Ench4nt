'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { C, Icon } from '../drama-ui';
import { supabase } from '../drama-auth';
import { PushCard, markNotificationsSeen } from '../drama-extras';

// ----------------------------------------------------------------------

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Дөнгөж сая';
  if (s < 3600) return `${Math.floor(s / 60)} минутын өмнө`;
  if (s < 86400) return `${Math.floor(s / 3600)} цагийн өмнө`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} өдрийн өмнө`;
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function DramaNotificationsView() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    markNotificationsSeen();
    if (!supabase) {
      setItems([]);
      return;
    }
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setItems(data ?? []));
  }, []);

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 6 }}>
      <Box component="h1" sx={{ m: 0, mb: 2, fontSize: 22, fontWeight: 800 }}>
        Мэдэгдэл
      </Box>

      <PushCard />

      <Box sx={{ mt: 2.5, display: 'grid', gap: 1 }}>
        {items === null &&
          [0, 1, 2].map((i) => <Box key={i} sx={{ height: 76, borderRadius: 3, bgcolor: C.surface, opacity: 0.6 }} />)}

        {items?.length === 0 && (
          <Box sx={{ py: 8, textAlign: 'center', color: C.muted, fontSize: 14 }}>
            <Icon name="bell" size={40} sx={{ mx: 'auto', mb: 1.5, opacity: 0.4 }} />
            Одоогоор мэдэгдэл алга.
          </Box>
        )}

        {items?.map((n) => {
          const inner = (
            <>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: C.grad, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name="bell" size={18} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ fontWeight: 700, fontSize: 15 }}>{n.title}</Box>
                {n.body && <Box sx={{ mt: 0.3, fontSize: 14, color: 'rgba(244,240,250,0.8)', lineHeight: 1.5 }}>{n.body}</Box>}
                <Box sx={{ mt: 0.5, fontSize: 12, color: C.muted }}>{timeAgo(n.created_at)}</Box>
              </Box>
              {n.url && <Icon name="chevronRight" size={18} sx={{ color: C.muted, alignSelf: 'center' }} />}
            </>
          );
          const sx = { display: 'flex', gap: 1.5, p: 1.75, borderRadius: 3, bgcolor: C.surface, color: C.text, textDecoration: 'none' };
          return n.url?.startsWith('/') ? (
            <Box key={n.id} component={RouterLink} href={n.url} sx={{ ...sx, '&:hover': { bgcolor: C.surface2 } }}>
              {inner}
            </Box>
          ) : (
            <Box key={n.id} sx={sx}>
              {inner}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
