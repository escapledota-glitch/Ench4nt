'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';

import { RouterLink } from 'src/routes/components';

import { C, Icon } from './drama-ui';
import { supabase } from './drama-auth';
import { usePush, useInstall } from './drama-pwa';

// ----------------------------------------------------------------------

const DISMISS_KEY = 'kino444-install-dismissed';
const SEEN_KEY = 'kino444-notif-seen';

const read = (k) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k, v) => {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    // ignore
  }
};

const pill = {
  px: 2,
  height: 40,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.8,
  border: 0,
  borderRadius: 6,
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
};

// ----------------------------------------------------------------------
// "Апп болгон суулгах" карт. compact = нүүр хуудсанд (хаах боломжтой)

export function InstallCard({ compact }) {
  const { state, promptInstall } = useInstall();
  const [dismissed, setDismissed] = useState(true);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    setDismissed(compact ? !!read(DISMISS_KEY) : false);
  }, [compact]);

  if (state === 'installed' || state === 'unavailable' || dismissed) return null;

  const onInstall = () => (state === 'ios' ? setIosHelp(true) : promptInstall());

  return (
    <>
      <Box
        sx={{
          mt: compact ? 2.5 : 0,
          p: 1.5,
          pr: compact ? 1 : 1.5,
          borderRadius: 3,
          bgcolor: C.surface,
          border: `1px solid ${C.line}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box component="img" src="/kino/icon-192.png" alt="" sx={{ width: 44, height: 44, borderRadius: 2, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ fontWeight: 700, fontSize: 14 }}>444 Кино апп суулгах</Box>
          <Box sx={{ fontSize: 12, color: C.muted }}>Нүүр дэлгэцээс шууд нээж, мэдэгдэл аваарай</Box>
        </Box>
        <Box component="button" onClick={onInstall} sx={{ ...pill, background: C.grad, color: '#fff', px: 1.8, height: 36 }}>
          Суулгах
        </Box>
        {compact && (
          <Box
            component="button"
            aria-label="Хаах"
            onClick={() => {
              write(DISMISS_KEY, '1');
              setDismissed(true);
            }}
            sx={{ border: 0, bgcolor: 'transparent', color: C.muted, p: 0.5, cursor: 'pointer' }}
          >
            <Icon name="close" size={18} />
          </Box>
        )}
      </Box>

      <Drawer
        anchor="bottom"
        open={iosHelp}
        onClose={() => setIosHelp(false)}
        slotProps={{ paper: { sx: { bgcolor: C.surface, color: C.text, backgroundImage: 'none', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxWidth: 520, mx: 'auto', p: 3, pb: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' } } }}
      >
        <Box sx={{ fontSize: 18, fontWeight: 800, mb: 2 }}>iPhone дээр суулгах</Box>
        {[
          ['1', <>Safari хөтчийн доод хэсэгт байрлах <b>Хуваалцах</b> (□↑) товчийг дарна.</>],
          ['2', <>Доош гүйлгээд <b>Add to Home Screen</b> (Нүүр дэлгэцэнд нэмэх)-ийг сонгоно.</>],
          ['3', <>Баруун дээд буланд <b>Add</b> дарна. Ингээд 444 Кино таны утсан дээр апп шиг харагдана.</>],
        ].map(([n, text]) => (
          <Box key={n} sx={{ display: 'flex', gap: 1.5, mb: 1.5, fontSize: 14, lineHeight: 1.55 }}>
            <Box sx={{ width: 26, height: 26, borderRadius: '50%', background: C.grad, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
              {n}
            </Box>
            <span>{text}</span>
          </Box>
        ))}
        <Box component="button" onClick={() => setIosHelp(false)} sx={{ ...pill, mt: 1, width: 1, height: 46, bgcolor: C.surface2, color: C.text }}>
          Ойлголоо
        </Box>
      </Drawer>
    </>
  );
}

// ----------------------------------------------------------------------
// Push мэдэгдэл асаах/унтраах

export function PushCard() {
  const { status, busy, enable, disable } = usePush();

  if (status === 'loading' || status === 'unsupported') return null;

  const text = {
    on: 'Шинэ анги, цуврал гарахад танд мэдэгдэнэ.',
    off: 'Шинэ анги гарахад утсандаа мэдэгдэл аваарай.',
    denied: 'Мэдэгдэл хаагдсан байна. Хөтчийн тохиргооноос зөвшөөрнө үү.',
    'ios-needs-install': 'iPhone дээр мэдэгдэл авахын тулд эхлээд 444 Кино-г нүүр дэлгэцэнд суулгана уу.',
  }[status];

  return (
    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: C.surface, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: C.surface2, display: 'grid', placeItems: 'center', color: status === 'on' ? C.accent2 : C.muted, flexShrink: 0 }}>
        <Icon name="bell" size={22} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ fontWeight: 700, fontSize: 14 }}>Мэдэгдэл</Box>
        <Box sx={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{text}</Box>
      </Box>
      {(status === 'on' || status === 'off') && (
        <Box
          component="button"
          role="switch"
          aria-checked={status === 'on'}
          aria-label="Мэдэгдэл"
          disabled={busy}
          onClick={status === 'on' ? disable : enable}
          sx={{
            position: 'relative',
            width: 50,
            height: 30,
            border: 0,
            borderRadius: 15,
            cursor: 'pointer',
            flexShrink: 0,
            background: status === 'on' ? C.grad : C.surface2,
            transition: 'background 200ms',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 3,
              left: status === 'on' ? 23 : 3,
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: '#fff',
              transition: 'left 200ms',
            },
          }}
        />
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------
// Толгой хэсгийн хонх (шинэ мэдэгдэл байвал улаан цэг)

export function NotificationBell() {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('notifications')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const latest = data?.[0]?.created_at;
        if (latest) setHasNew(new Date(latest).getTime() > Number(read(SEEN_KEY) || 0));
      });
  }, []);

  return (
    <Box
      component={RouterLink}
      href="/drama/notifications"
      aria-label={hasNew ? 'Мэдэгдэл (шинэ)' : 'Мэдэгдэл'}
      sx={{ position: 'relative', color: C.muted, display: 'grid', placeItems: 'center', width: 36, height: 36, '&:hover': { color: C.text } }}
    >
      <Icon name="bell" size={22} />
      {hasNew && (
        <Box sx={{ position: 'absolute', top: 6, right: 7, width: 9, height: 9, borderRadius: '50%', bgcolor: C.accent2, border: `2px solid ${C.bg}` }} />
      )}
    </Box>
  );
}

export function markNotificationsSeen() {
  write(SEEN_KEY, String(Date.now()));
}
