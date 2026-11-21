'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { SUB_LANGS, DEFAULT_SUB_STYLE } from 'src/lib/subtitles';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useCues, SubtitleText } from 'src/sections/drama/drama-subtitles';

import { errorText, listSubtitles, deleteSubtitle, uploadSubtitle, getSubtitleStyle, saveSubtitleStyle } from '../kino-api';

// ----------------------------------------------------------------------
// Хадмал: анги бүрт .srt/.vtt оруулах + харагдах байдлыг (X, Y, хэмжээ…) тохируулах.
// Үзэгчид өөрчлөх боломжгүй — энд тохируулсан байдлаар л харагдана.
// ----------------------------------------------------------------------

const COLORS = ['#ffffff', '#ffd400', '#7dd3fc', '#86efac', '#f9a8d4'];
const SAMPLE = 'Энэ бол хадмалын жишээ.\nХоёр дахь мөр ингэж харагдана.';

export function KinoSubtitlesCard({ seriesId, total, poster }) {
  const [subs, setSubs] = useState(null); // { [ep]: ['mn'] }
  const [style, setStyle] = useState(null);
  const [savedStyle, setSavedStyle] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    listSubtitles(seriesId)
      .then(setSubs)
      .catch((e) => {
        toast.error(errorText(e));
        setSubs({});
      });
  }, [seriesId]);

  useEffect(() => {
    load();
    getSubtitleStyle(seriesId)
      .then((s) => {
        setStyle(s);
        setSavedStyle(s);
      })
      .catch(() => {
        setStyle({ ...DEFAULT_SUB_STYLE });
        setSavedStyle({ ...DEFAULT_SUB_STYLE });
      });
  }, [seriesId, load]);

  const dirty = style && savedStyle && JSON.stringify(style) !== JSON.stringify(savedStyle);

  const save = async () => {
    setSaving(true);
    try {
      const s = await saveSubtitleStyle(seriesId, style);
      setStyle(s);
      setSavedStyle(s);
      toast.success('Хадмалын тохиргоо хадгалагдлаа');
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ p: 3, mt: 3 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
        <Iconify icon="solar:subtitles-bold-duotone" width={24} sx={{ color: 'primary.main' }} />
        <Typography variant="h6">Хадмал</Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Анги бүрт .srt эсвэл .vtt файл оруулна. Байрлал, хэмжээг та тохируулна — үзэгчид өөрчлөх боломжгүй.
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 300px' }, alignItems: 'start' }}>
        {/* Зүүн: файлууд + тохиргоо */}
        <Stack spacing={3}>
          <UploadRow seriesId={seriesId} total={total} onDone={load} />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Оруулсан хадмал
            </Typography>
            {subs === null ? (
              <LinearProgress />
            ) : Object.keys(subs).length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                Одоогоор хадмал алга.
              </Typography>
            ) : (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(subs)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .flatMap(([ep, langs]) =>
                    langs.map((lang) => (
                      <Chip
                        key={`${ep}-${lang}`}
                        label={`${ep}-р анги · ${SUB_LANGS[lang]}`}
                        onDelete={async () => {
                          try {
                            await deleteSubtitle(seriesId, ep, lang);
                            toast.success('Устгалаа');
                            load();
                          } catch (e) {
                            toast.error(errorText(e));
                          }
                        }}
                      />
                    ))
                  )}
              </Stack>
            )}
          </Box>

          <Divider />

          {style && <StyleControls style={style} onChange={setStyle} />}

          <Stack direction="row" spacing={1}>
            <Button variant="contained" disabled={!dirty} loading={saving} onClick={save}>
              Тохиргоо хадгалах
            </Button>
            <Button color="inherit" onClick={() => setStyle({ ...DEFAULT_SUB_STYLE })}>
              Анхны байдал
            </Button>
          </Stack>
        </Stack>

        {/* Баруун: урьдчилан харах */}
        {style && <Preview seriesId={seriesId} subs={subs} style={style} poster={poster} onMove={setStyle} />}
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

function UploadRow({ seriesId, total, onDone }) {
  const input = useRef(null);
  const [ep, setEp] = useState(1);
  const [lang, setLang] = useState('mn');
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      await uploadSubtitle(seriesId, ep, lang, file);
      toast.success(`${ep}-р ангийн хадмал (${SUB_LANGS[lang]}) хадгалагдлаа`);
      onDone();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField select size="small" label="Анги" value={ep} onChange={(e) => setEp(Number(e.target.value))} sx={{ minWidth: 110 }}>
        {Array.from({ length: Math.max(1, total) }, (_, i) => i + 1).map((n) => (
          <MenuItem key={n} value={n}>
            {n}-р анги
          </MenuItem>
        ))}
      </TextField>
      <TextField select size="small" label="Хэл" value={lang} onChange={(e) => setLang(e.target.value)} sx={{ minWidth: 130 }}>
        {Object.entries(SUB_LANGS).map(([k, v]) => (
          <MenuItem key={k} value={k}>
            {v}
          </MenuItem>
        ))}
      </TextField>
      <Button variant="outlined" loading={busy} onClick={() => input.current?.click()} startIcon={<Iconify icon="solar:upload-bold" />}>
        .srt / .vtt оруулах
      </Button>
      <input ref={input} type="file" accept=".srt,.vtt,text/vtt,application/x-subrip" hidden onChange={pick} />
    </Stack>
  );
}

// ----------------------------------------------------------------------

function Row({ label, value, children }) {
  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {value}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

function StyleControls({ style, onChange }) {
  const set = (k) => (_e, v) => onChange({ ...style, [k]: v });

  return (
    <Stack spacing={2}>
      <Row label="Хэвтээ байрлал (X)" value={`${style.x}%`}>
        <Slider value={style.x} min={0} max={100} onChange={set('x')} />
      </Row>
      <Row label="Босоо байрлал (Y)" value={`${style.y}% (0 = дээр, 100 = доор)`}>
        <Slider value={style.y} min={0} max={100} onChange={set('y')} />
      </Row>
      <Row label="Үсгийн хэмжээ" value={style.size}>
        <Slider value={style.size} min={10} max={48} onChange={set('size')} />
      </Row>
      <Row label="Мөрийн өргөн" value={`${style.width}%`}>
        <Slider value={style.width} min={40} max={100} onChange={set('width')} />
      </Row>
      <Row label="Хугацаа (эрт / хожуу)" value={`${style.delay > 0 ? '+' : ''}${style.delay} сек`}>
        <Slider value={style.delay} min={-10} max={10} step={0.1} onChange={set('delay')} />
      </Row>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Өнгө
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {COLORS.map((c) => (
            <Box
              key={c}
              component="button"
              type="button"
              aria-label={c}
              onClick={() => onChange({ ...style, color: c })}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: c,
                cursor: 'pointer',
                border: style.color === c ? '3px solid' : '1px solid',
                borderColor: style.color === c ? 'primary.main' : 'divider',
              }}
            />
          ))}
          <Box component="input" type="color" value={style.color} onChange={(e) => onChange({ ...style, color: e.target.value })} sx={{ width: 40, height: 34, border: 0, bgcolor: 'transparent', cursor: 'pointer' }} />
        </Stack>
      </Box>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <ToggleButtonGroup size="small" exclusive value={style.bg} onChange={(_e, v) => v && onChange({ ...style, bg: v })}>
          <ToggleButton value="none">Ардгүй</ToggleButton>
          <ToggleButton value="shadow">Сүүдэр</ToggleButton>
          <ToggleButton value="box">Хайрцаг</ToggleButton>
        </ToggleButtonGroup>
        <FormControlLabel control={<Switch checked={style.bold} onChange={(e) => onChange({ ...style, bold: e.target.checked })} />} label="Тод" />
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------
// Утасны хэмжээтэй урьдчилан харах. Хадмалыг чирж байрлуулж болно.

function Preview({ seriesId, subs, style, poster, onMove }) {
  const box = useRef(null);
  const firstEp = subs ? Object.keys(subs).sort((a, b) => a - b)[0] : null;
  const url =
    firstEp && subs[firstEp]?.length
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kino/subtitles/${seriesId}/${firstEp}/${subs[firstEp][0]}.vtt?t=${Math.floor(Date.now() / 60000)}`
      : null;
  const cues = useCues(url);
  const text = cues.find((c) => c.text.length > 8)?.text || SAMPLE;

  const drag = (e) => {
    const el = box.current;
    if (!el) return;
    const move = (ev) => {
      const p = ev.touches ? ev.touches[0] : ev;
      const r = el.getBoundingClientRect();
      const x = Math.round(Math.min(100, Math.max(0, ((p.clientX - r.left) / r.width) * 100)));
      const y = Math.round(Math.min(100, Math.max(0, ((p.clientY - r.top) / r.height) * 100)));
      onMove((s) => ({ ...s, x, y }));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    move(e);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Урьдчилан харах <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>(дарж чирээд байрлуулна)</Typography>
      </Typography>
      <Box
        ref={box}
        onPointerDown={drag}
        sx={{
          containerType: 'inline-size',
          position: 'relative',
          width: 1,
          maxWidth: 300,
          aspectRatio: '9 / 16',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#111',
          cursor: 'crosshair',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {poster && <Box component="img" src={poster} alt="" draggable={false} sx={{ width: 1, height: 1, objectFit: 'cover', opacity: 0.85 }} />}
        <SubtitleText text={text} style={style} />
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
        Утас, компьютер дээр ижил харьцаагаар харагдана.
      </Typography>
    </Box>
  );
}
