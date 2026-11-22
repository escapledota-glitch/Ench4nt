'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { useCues, pickCueMoments } from 'src/sections/drama/drama-subtitles';

// ----------------------------------------------------------------------
// Хадмал гардаг мөчүүдийн кадрууд: дарахад тэр кадр руу үсэрч зогсоно.
// ◀ ▶ — нэг кадраар алхах. Хуучин хадмалыг харж хаалтаа тааруулахад.
// ----------------------------------------------------------------------

const FRAME = 1 / 24;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function waitSeek(v, t) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      v.removeEventListener('seeked', finish);
      // дараагийн зурагт гарахыг хүлээнэ
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    };
    v.addEventListener('seeked', finish);
    setTimeout(finish, 5000);
    v.currentTime = t;
  });
}

export function FrameStrip({ videoRef, cueUrl, duration, dark = false }) {
  const cues = useCues(cueUrl);
  const [thumbs, setThumbs] = useState({}); // { [t]: dataURL }
  const [busy, setBusy] = useState(false);

  // Хадмал байхгүй бол кино даяар жигд 10 мөч
  const moments = cues.length
    ? pickCueMoments(cues, 10)
    : duration
      ? Array.from({ length: 10 }, (_, i) => +(((i + 0.5) * duration) / 10).toFixed(2))
      : [];

  const jump = (t) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = t;
  };
  const step = (d) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = Math.max(0, v.currentTime + d);
  };

  const capture = async () => {
    const v = videoRef.current;
    if (!v || !moments.length) return;
    setBusy(true);
    const back = v.currentTime;
    v.pause();
    const c = document.createElement('canvas');
    c.width = 90;
    c.height = 160;
    const ctx = c.getContext('2d');
    const out = {};
    for (const t of moments) {
       
      await waitSeek(v, t);
      try {
        ctx.drawImage(v, 0, 0, c.width, c.height);
        out[t] = c.toDataURL('image/jpeg', 0.7);
        setThumbs((prev) => ({ ...prev, [t]: out[t] }));
      } catch {
        break; // зургийг унших эрхгүй — зөвхөн цагаар харуулна
      }
    }
    await waitSeek(v, back);
    setBusy(false);
  };

  const textColor = dark ? 'rgba(255,255,255,0.7)' : 'text.secondary';

  return (
    <Box>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mb: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}>
        <Typography variant="caption" sx={{ color: textColor, mr: 0.5 }}>
          {cues.length ? 'Хадмалтай мөчүүд:' : 'Кадрууд:'}
        </Typography>
        <Tooltip title="1 секунд буцаах">
          <IconButton size="small" onClick={() => step(-1)} sx={{ color: dark ? '#fff' : undefined }}>
            <Iconify icon="solar:rewind-back-bold" width={16} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Өмнөх кадр">
          <IconButton size="small" onClick={() => step(-FRAME)} sx={{ color: dark ? '#fff' : undefined }}>
            <Iconify icon="eva:arrow-ios-back-fill" width={18} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Дараагийн кадр">
          <IconButton size="small" onClick={() => step(FRAME)} sx={{ color: dark ? '#fff' : undefined }}>
            <Iconify icon="eva:arrow-ios-forward-fill" width={18} />
          </IconButton>
        </Tooltip>
        <Tooltip title="1 секунд урагшлуулах">
          <IconButton size="small" onClick={() => step(1)} sx={{ color: dark ? '#fff' : undefined }}>
            <Iconify icon="solar:rewind-forward-bold" width={16} />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        {moments.length > 0 && !Object.keys(thumbs).length && (
          <Button size="small" variant="outlined" color="inherit" loading={busy} onClick={capture} sx={{ color: dark ? '#fff' : undefined }}>
            Кадр харуулах
          </Button>
        )}
      </Stack>

      <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'thin' }}>
        {moments.map((t) => (
          <Box
            key={t}
            component="button"
            type="button"
            onClick={() => jump(t)}
            title={`${fmt(t)} руу үсрэх`}
            sx={{
              flexShrink: 0,
              width: 54,
              p: 0,
              border: '1px solid',
              borderColor: dark ? 'rgba(255,255,255,0.25)' : 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: dark ? 'rgba(255,255,255,0.08)' : 'background.neutral',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            {thumbs[t] ? (
              <Box component="img" src={thumbs[t]} alt="" sx={{ display: 'block', width: 1, aspectRatio: '9 / 16', objectFit: 'cover' }} />
            ) : (
              <Box sx={{ width: 1, aspectRatio: '9 / 16', display: 'grid', placeItems: 'center' }}>
                <Iconify icon="solar:play-bold" width={14} sx={{ opacity: 0.5, color: dark ? '#fff' : undefined }} />
              </Box>
            )}
            <Box sx={{ fontSize: 10, fontWeight: 600, py: 0.25, color: dark ? '#fff' : 'text.primary' }}>{fmt(t)}</Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
