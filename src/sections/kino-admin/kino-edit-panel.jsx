'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Iconify } from 'src/components/iconify';

import { errorText, saveSubtitleStyle } from './kino-api';
import { StyleControls } from './view/kino-subtitles-card';

// ----------------------------------------------------------------------
// Жинхэнэ тоглуулагч дээр хадмал / хаалт туузыг тааруулах самбар (зөвхөн админд).
// Дэлгэц дээр дарж чирээд байрлуулна; доорх самбараар бусад тохиргоо.
// ----------------------------------------------------------------------

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function KinoEditPanel({ seriesId, style, onChange, dragTarget, onDragTarget, videoRef, time, duration, paused, onExit }) {
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const saved = await saveSubtitleStyle(seriesId, style);
      onChange(saved);
      setMsg('✓ Хадгалагдлаа — бүх үзэгчдэд ингэж харагдана');
    } catch (e) {
      setMsg(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const v = videoRef.current;

  return (
    <Box
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1400,
        maxWidth: 520,
        mx: 'auto',
        bgcolor: 'rgba(255,255,255,0.97)',
        color: '#1c252e',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.45)',
        pb: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Толгой хэсэг — үргэлж харагдана */}
      <Box sx={{ px: 1.5, pt: 1, pb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton size="small" onClick={() => setOpen((o) => !o)} title={open ? 'Самбар хураах' : 'Самбар нээх'}>
            <Iconify icon={open ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-upward-fill'} />
          </IconButton>
          <Typography variant="subtitle2" sx={{ flex: 1 }} noWrap>
            Дэлгэц дээр тааруулах
          </Typography>
          <Button size="small" color="inherit" onClick={onExit}>
            Гарах
          </Button>
          <Button size="small" variant="contained" loading={saving} onClick={save}>
            Хадгалах
          </Button>
        </Stack>

        {/* Тоглуулах / гүйлгэх */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
          <IconButton size="small" onClick={() => v && (v.paused ? v.play() : v.pause())}>
            <Iconify icon={paused ? 'solar:play-bold' : 'solar:pause-bold'} />
          </IconButton>
          <IconButton size="small" onClick={() => v && (v.currentTime = Math.max(0, v.currentTime - 2))} title="2 сек буцаах">
            <Iconify icon="solar:rewind-back-bold" width={18} />
          </IconButton>
          <Slider
            size="small"
            value={time}
            min={0}
            max={duration || 1}
            step={0.2}
            onChange={(_e, val) => {
              if (v) v.currentTime = val;
            }}
          />
          <Typography variant="caption" sx={{ minWidth: 76, textAlign: 'right', color: 'text.secondary' }}>
            {fmt(time)} / {fmt(duration)}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Дэлгэц дээр чирэх:
          </Typography>
          <ToggleButtonGroup size="small" exclusive value={dragTarget} onChange={(_e, val) => val && onDragTarget(val)}>
            <ToggleButton value="sub">Хадмал</ToggleButton>
            <ToggleButton value="mask" disabled={!style?.mask?.on}>
              Хаалт тууз
            </ToggleButton>
            <ToggleButton value="none">Чирэхгүй</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        {msg && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: msg.startsWith('✓') ? 'success.main' : 'error.main' }}>
            {msg}
          </Typography>
        )}
      </Box>

      {open && (
        <Box sx={{ maxHeight: '38vh', overflowY: 'auto', px: 1.5, pb: 2, borderTop: '1px solid rgba(0,0,0,0.08)', pt: 1.5 }}>
          <StyleControls style={style} onChange={onChange} />
        </Box>
      )}
    </Box>
  );
}
