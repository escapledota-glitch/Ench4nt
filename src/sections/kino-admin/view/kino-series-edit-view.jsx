'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { DashboardContent } from 'src/layouts/dashboard';
import { withPart, parsePart, parseClock, formatClock } from 'src/lib/video-parts';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { GENRES, freeLabel } from 'src/sections/drama/drama-data';

import { KinoSubtitlesCard } from './kino-subtitles-card';
import { slugify, errorText, saveSeries, uploadImage, listEpisodes, saveEpisodes, getSeriesRow, setEpisodeCount } from '../kino-api';

// ----------------------------------------------------------------------

const EMPTY = {
  id: '',
  title: '',
  description: '',
  genres: [],
  poster: '',
  backdrop: '',
  badge: '',
  rating: 4.5,
  views: '0',
  episodes: 20,
  free_episodes: 10,
  free_minutes: 0,
  price: 5900,
  published: false,
  sort: 0,
};

export function KinoSeriesEditView({ id }) {
  const router = useRouter();
  const isNew = !id;

  const [form, setForm] = useState(isNew ? EMPTY : null);
  const [idTouched, setIdTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    getSeriesRow(id)
      .then((row) => {
        if (!row) {
          toast.error('Цуврал олдсонгүй');
          router.replace('/dashboard/kino/series');
        } else setForm({ ...EMPTY, ...row, badge: row.badge ?? '' });
      })
      .catch((e) => toast.error(errorText(e)));
  }, [id, isNew, router]);

  if (!form) {
    return (
      <DashboardContent>
        <LinearProgress />
      </DashboardContent>
    );
  }

  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'title' && !idTouched) next.id = slugify(value);
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Нэр оруулна уу');
    if (!/^[a-z0-9-]+$/.test(form.id)) return toast.error('Холбоосны нэр зөвхөн латин жижиг үсэг, тоо, зураас байна');
    if (!form.poster) return toast.error('Постер зураг оруулна уу');

    setSaving(true);
    try {
      const row = {
        id: form.id,
        title: form.title.trim(),
        description: form.description.trim(),
        genres: form.genres,
        poster: form.poster,
        backdrop: form.backdrop || form.poster,
        badge: form.badge || null,
        rating: Number(form.rating) || 0,
        views: String(form.views || '0'),
        episodes: Math.max(1, Number(form.episodes) || 1),
        free_episodes: Math.max(0, Number(form.free_episodes) || 0),
        free_minutes: Math.max(0, Math.round(Number(form.free_minutes) || 0)),
        price: Math.max(0, Math.round(Number(form.price) || 0)),
        published: !!form.published,
        sort: Number(form.sort) || 0,
      };
      await saveSeries(row, isNew ? null : id);
      toast.success('Хадгаллаа');
      if (isNew || row.id !== id) router.replace(`/dashboard/kino/series/${row.id}`);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={isNew ? 'Шинэ цуврал' : form.title}
        links={[
          { name: '444 Кино', href: '/dashboard/kino' },
          { name: 'Цуврал', href: '/dashboard/kino/series' },
          { name: isNew ? 'Шинэ' : 'Засах' },
        ]}
        action={
          !isNew && (
            <Button href={`/drama/${id}`} target="_blank" variant="outlined" color="inherit" startIcon={<Iconify icon="solar:eye-bold" />}>
              Сайт дээр харах
            </Button>
          )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <TextField label="Нэр" value={form.title} onChange={set('title')} required fullWidth />
            <TextField
              label="Холбоосны нэр"
              value={form.id}
              onChange={(e) => {
                setIdTouched(true);
                set('id')(e.target.value.toLowerCase());
              }}
              helperText={`Сайтын хаяг: /drama/${form.id || '...'}`}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">/drama/</InputAdornment> } }}
              fullWidth
            />
            <TextField label="Тайлбар" value={form.description} onChange={set('description')} multiline minRows={4} fullWidth />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Төрөл
              </Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {GENRES.slice(1).map((g) => {
                  const on = form.genres.includes(g);
                  return (
                    <Chip
                      key={g}
                      label={g}
                      color={on ? 'primary' : 'default'}
                      variant={on ? 'filled' : 'outlined'}
                      onClick={() => set('genres')(on ? form.genres.filter((x) => x !== g) : [...form.genres, g])}
                    />
                  );
                })}
              </Stack>
              {form.genres.length === 0 && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'warning.main' }}>
                  ⚠ Төрөл сонгоогүй байна — нүүр хуудасны төрлийн жагсаалтуудад харагдахгүй (зөвхөн «Бүх кино»-д).
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' } }}>
              <TextField label="Нийт анги" type="number" value={form.episodes} onChange={set('episodes')} slotProps={{ htmlInput: { min: 1 } }} />
              <TextField label="Үнэлгээ" type="number" value={form.rating} onChange={set('rating')} slotProps={{ htmlInput: { min: 0, max: 5, step: 0.1 } }} />
              <TextField label="Үзэлт" value={form.views} onChange={set('views')} placeholder="2.4 сая" />
            </Box>

            <FreeAccessCard form={form} set={set} />

            <PriceCard form={form} set={set} />

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField select label="Тэмдэг" value={form.badge} onChange={set('badge')}>
                <MenuItem value="">Байхгүй</MenuItem>
                <MenuItem value="Онцлох">Онцлох (нүүрний том зураг)</MenuItem>
                <MenuItem value="Шинэ">Шинэ</MenuItem>
                <MenuItem value="Топ">Топ</MenuItem>
              </TextField>
              <TextField label="Эрэмбэ" type="number" value={form.sort} onChange={set('sort')} helperText="Бага тоо түрүүлж харагдана — Топ 10-ын байр ч мөн (хамгийн бага = #1)" />
            </Box>
          </Stack>
        </Card>

        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <FormControlLabel
              control={<Switch checked={!!form.published} onChange={set('published')} />}
              label={form.published ? 'Сайт дээр харагдана' : 'Нуусан (ноорог)'}
            />
            <Button type="submit" variant="contained" size="large" fullWidth loading={saving} sx={{ mt: 2 }}>
              {isNew ? 'Үүсгэх' : 'Хадгалах'}
            </Button>
          </Card>

          <Card sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <ImageField label="Постер (босоо 3:4)" value={form.poster} onChange={set('poster')} ratio="3 / 4" folder="posters" />
              <ImageField label="Арын зураг (хэвтээ 16:9)" value={form.backdrop} onChange={set('backdrop')} ratio="16 / 9" folder="backdrops" />
            </Stack>
          </Card>
        </Stack>
      </Box>

      {!isNew && (
        <EpisodesCard
          seriesId={id}
          total={Number(form.episodes) || 0}
          free={Number(form.free_episodes) || 0}
          onSplit={(count, freeCount) => setForm((f) => ({ ...f, episodes: count, free_episodes: freeCount }))}
        />
      )}

      {!isNew && <KinoSubtitlesCard seriesId={id} total={Number(form.episodes) || 1} poster={form.poster} />}
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function ImageField({ label, value, onChange, ratio, folder }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Зураг 5MB-аас бага байх ёстой');
      return;
    }
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box
        onClick={() => input.current?.click()}
        sx={{
          aspectRatio: ratio,
          maxHeight: 260,
          mx: 'auto',
          borderRadius: 1.5,
          overflow: 'hidden',
          cursor: 'pointer',
          bgcolor: 'background.neutral',
          border: (t) => `1px dashed ${t.vars.palette.divider}`,
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
        }}
      >
        {value ? (
          <Box component="img" src={value} alt="" sx={{ width: 1, height: 1, objectFit: 'cover' }} />
        ) : (
          <Stack sx={{ alignItems: 'center', color: 'text.disabled' }}>
            <Iconify icon="solar:gallery-add-bold" width={32} />
            <Typography variant="caption">Зураг сонгох</Typography>
          </Stack>
        )}
        {busy && <LinearProgress sx={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} />}
      </Box>
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
      <TextField size="small" value={value} onChange={onChange} placeholder="эсвэл зургийн холбоос (https://…)" fullWidth sx={{ mt: 1 }} />
    </Box>
  );
}

// ----------------------------------------------------------------------
// Багцгүй үзэгчид юу үнэгүй үзэх вэ

const MINUTE_PRESETS = [0, 2, 5, 10, 15, 30];

function FreeAccessCard({ form, set }) {
  const total = Number(form.episodes) || 1;
  const eps = Number(form.free_episodes) || 0;
  const mins = Number(form.free_minutes) || 0;
  const isMovie = total === 1;

  const summary = freeLabel({ episodes: total, freeEpisodes: eps, freeMinutes: mins });

  return (
    <Box sx={{ p: 2.5, borderRadius: 1.5, border: (t) => `1px dashed ${t.vars.palette.divider}`, bgcolor: 'background.neutral' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <Iconify icon="solar:lock-keyhole-minimalistic-unlocked-bold-duotone" width={22} sx={{ color: 'warning.main' }} />
        <Typography variant="subtitle1">Үнэгүй үзэх тохиргоо</Typography>
      </Stack>

      {/* Бүтэн үнэгүй анги — утсан дээр ч нэг товшилтоор (0 оруулахад амар) */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle2">Бүтэн үнэгүй анги</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
          {isMovie ? 'Кинонд: 0 = захиалгатай, 1 = бүтэн үнэгүй' : `Эхний хэдэн анги бүтэн үнэгүй (нийт ${total})`}
        </Typography>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="inherit"
            disabled={eps <= 0}
            onClick={() => set('free_episodes')(Math.max(0, eps - 1))}
            sx={{ minWidth: 44, px: 0, fontSize: 20 }}
          >
            −
          </Button>
          <Box sx={{ minWidth: 48, textAlign: 'center', typography: 'h5' }}>{eps}</Box>
          <Button
            variant="outlined"
            color="inherit"
            disabled={eps >= total}
            onClick={() => set('free_episodes')(Math.min(total, eps + 1))}
            sx={{ minWidth: 44, px: 0, fontSize: 20 }}
          >
            +
          </Button>
          {[...new Set([0, 1, 3, 5, 10, total].filter((n) => n <= total))].map((n) => (
            <Chip
              key={n}
              label={n === total && total > 1 ? `Бүгд (${n})` : n === 0 ? '0 — захиалгатай' : n === total ? `${n} — бүтэн үнэгүй` : n}
              color={eps === n ? 'primary' : 'default'}
              variant={eps === n ? 'filled' : 'outlined'}
              onClick={() => set('free_episodes')(n)}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr' }}>
        <TextField
          label="Үнэгүй үзэх хугацаа"
          type="number"
          value={form.free_minutes}
          onChange={set('free_minutes')}
          slotProps={{
            htmlInput: { min: 0, step: 1 },
            input: { endAdornment: <InputAdornment position="end">минут</InputAdornment> },
          }}
          helperText={isMovie ? 'Багцгүй хүн киноны эхний хэдэн минутыг үзэх' : 'Түгжээтэй анги бүрийн эхний хэдэн минутыг үзэх'}
        />
      </Box>

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        {MINUTE_PRESETS.map((m) => (
          <Chip
            key={m}
            size="small"
            label={m === 0 ? 'Үнэгүй хугацаагүй' : `${m} мин`}
            color={mins === m ? 'primary' : 'default'}
            variant={mins === m ? 'filled' : 'outlined'}
            onClick={() => set('free_minutes')(m)}
          />
        ))}
      </Stack>

      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        Багцгүй үзэгчдэд: <b>{summary}</b>
      </Typography>
    </Box>
  );
}

// ----------------------------------------------------------------------
// Энэ киног тусдаа худалдаж авах үнэ

const PRICE_PRESETS = [0, 3900, 5900, 7900, 9900];

function PriceCard({ form, set }) {
  const price = Number(form.price) || 0;
  return (
    <Box sx={{ p: 2.5, borderRadius: 1.5, border: (t) => `1px dashed ${t.vars.palette.divider}`, bgcolor: 'background.neutral' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <Iconify icon="solar:tag-price-bold-duotone" width={22} sx={{ color: 'warning.main' }} />
        <Typography variant="subtitle1">Худалдах үнэ</Typography>
      </Stack>
      <TextField
        label="Үнэ"
        type="number"
        value={form.price}
        onChange={set('price')}
        fullWidth
        slotProps={{ htmlInput: { min: 0, step: 100 }, input: { endAdornment: <InputAdornment position="end">₮</InputAdornment> } }}
        helperText="Багцгүй үзэгч зөвхөн энэ киног нэг удаа төлж бүтэн үзнэ. 0 = тусдаа зарахгүй (зөвхөн багцаар)."
      />
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        {PRICE_PRESETS.map((p) => (
          <Chip
            key={p}
            label={p === 0 ? 'Зарахгүй' : `${p.toLocaleString('en-US')}₮`}
            color={price === p ? 'primary' : 'default'}
            variant={price === p ? 'filled' : 'outlined'}
            onClick={() => set('price')(p)}
          />
        ))}
      </Stack>
    </Box>
  );
}

// Bunny-гийн embed/iframe холбоосыг <video> тоглуулж чадахгүй
const isEmbedLink = (url) => /iframe\.mediadelivery\.net|player\.mediadelivery\.net|\/embed\//i.test(url ?? '');

// ----------------------------------------------------------------------

function EpisodesCard({ seriesId, total, free, onSplit }) {
  const [videos, setVideos] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState('');
  const [bulkStart, setBulkStart] = useState(1);
  const [splitOpen, setSplitOpen] = useState(false);

  useEffect(() => {
    listEpisodes(seriesId)
      .then((rows) => setVideos(Object.fromEntries(rows.map((r) => [r.ep, r.video_url]))))
      .catch((e) => {
        toast.error(errorText(e));
        setVideos({});
      });
  }, [seriesId]);

  const update = (ep, url) => {
    setVideos((v) => ({ ...v, [ep]: url }));
    setDirty(true);
  };

  const applyBulk = () => {
    const lines = bulk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const start = Math.max(1, Number(bulkStart) || 1);
    setVideos((v) => {
      const next = { ...v };
      lines.forEach((url, i) => {
        next[start + i] = url;
      });
      return next;
    });
    setDirty(true);
    setBulkOpen(false);
    setBulk('');
    toast.success(`${lines.length} анги нэмэгдлээ. "Хадгалах" дарна уу.`);
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveEpisodes(seriesId, videos);
      setDirty(false);
      toast.success('Ангиуд хадгалагдлаа');
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const filled = videos ? Object.values(videos).filter((u) => u?.trim()).length : 0;

  return (
    <Card sx={{ p: 3, mt: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2.5 }}>
        <Box>
          <Typography variant="h6">Ангиуд</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {filled}/{total} анги видеотой. Bunny Stream → видео → HLS Playlist URL (.m3u8)-ийг хуулна. Холбоосгүй анги туршилтын видео тоглуулна.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="inherit" onClick={() => setSplitOpen(true)} disabled={!videos} startIcon={<Iconify icon="solar:scissors-bold" />}>
            Нэг видеог хуваах
          </Button>
          <Button variant="outlined" color="inherit" onClick={() => setBulkOpen(true)} startIcon={<Iconify icon="solar:clipboard-list-bold" />}>
            Олноор оруулах
          </Button>
          <Button variant="contained" disabled={!dirty} loading={saving} onClick={save}>
            Хадгалах
          </Button>
        </Stack>
      </Stack>

      {!videos ? (
        <LinearProgress />
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
          {Array.from({ length: total }, (_, i) => i + 1).map((ep) => (
            <TextField
              key={ep}
              size="small"
              value={videos[ep] ?? ''}
              onChange={(e) => update(ep, e.target.value)}
              placeholder="https://vz-xxxx.b-cdn.net/<video-id>/playlist.m3u8"
              error={isEmbedLink(videos[ep])}
              helperText={
                isEmbedLink(videos[ep])
                  ? "Энэ нь embed холбоос байна. Bunny-гийн HLS Playlist URL (.m3u8) хуулна уу."
                  : partLabel(videos[ep])
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ minWidth: 64 }}>
                      <Typography variant="subtitle2" sx={{ color: ep <= free ? 'success.main' : 'warning.main' }}>
                        {ep}-р {ep <= free ? '' : '🔒'}
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
            />
          ))}
        </Box>
      )}

      {splitOpen && (
        <SplitDialog
          seriesId={seriesId}
          videos={videos}
          total={total}
          free={free}
          onClose={() => setSplitOpen(false)}
          onDone={(next, count, freeCount) => {
            setVideos(next);
            setDirty(false);
            onSplit?.(count, freeCount);
            setSplitOpen(false);
          }}
        />
      )}

      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Олноор оруулах</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Мөр бүрт нэг видео холбоос. Эхний мөр нь доорх ангиас эхэлнэ.
          </Typography>
          <TextField label="Эхлэх анги" type="number" size="small" value={bulkStart} onChange={(e) => setBulkStart(e.target.value)} sx={{ mb: 2, width: 140 }} />
          <TextField value={bulk} onChange={(e) => setBulk(e.target.value)} multiline minRows={8} fullWidth placeholder={'https://vz-xxxx.b-cdn.net/…/playlist.m3u8\nhttps://vz-xxxx.b-cdn.net/…/playlist.m3u8'} />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setBulkOpen(false)}>
            Болих
          </Button>
          <Button variant="contained" onClick={applyBulk} disabled={!bulk.trim()}>
            Оруулах
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

// "Хэсэг: 17:00 – 35:00" гэх мэт (хэсэг биш бол юу ч харуулахгүй)
function partLabel(url) {
  const { start, end } = parsePart(url);
  if (!start && !end) return undefined;
  return `✂ Хэсэг: ${formatClock(start)} – ${end ? formatClock(end) : 'төгсгөл'}`;
}

// ----------------------------------------------------------------------
// Нэг видеог хэд хэдэн анги болгох — анги бүрийг тусад нь тохируулна:
//   • бүтэн видеоны аль хэсэг (эхлэх – дуусах), эсвэл
//   • тусдаа оруулсан видео (жишээ нь зөвхөн 1-р хэсгийг Bunny-д тусад нь)
// Анги бүр дуусахад дараагийнх нь өөрөө үргэлжилнэ; үнэгүйгээс хойших нь захиалга шаардана.
// ----------------------------------------------------------------------

const DEFAULT_ROWS = [
  { own: '', start: '0:00', end: '17:00' },
  { own: '', start: '17:00', end: '' },
];

function rowsFromVideos(videos) {
  const list = Object.keys(videos || {})
    .map(Number)
    .filter((ep) => String(videos[ep] ?? '').trim())
    .sort((x, y) => x - y)
    .map((ep) => parsePart(videos[ep]));
  const windowed = list.filter((r) => r.start || r.end);
  if (!windowed.length) {
    if (!list.length) return { base: '', rows: DEFAULT_ROWS };
    // Хараахан хуваагаагүй: одоо байгаа анги бүр өөрийн холбоосоо хадгална (1-р ангийн
    // богино видеог "бүтэн видео" гэж андуурахгүй). Дараагийн анги нь бүтэн видеоноос.
    const rows = list.map((r) => ({ own: r.base, start: '', end: '' }));
    return { base: '', rows: rows.length === 1 ? [...rows, { own: '', start: '', end: '' }] : rows, fresh: true };
  }
  const base = windowed[0].base;
  return {
    base,
    rows: list.map((r) => ({
      own: r.base === base ? '' : r.base,
      start: r.start || r.base === base ? formatClock(r.start) : '',
      end: r.end ? formatClock(r.end) : '',
    })),
  };
}

function SplitDialog({ seriesId, videos, total, free, onClose, onDone }) {
  const initial = rowsFromVideos(videos);
  const [url, setUrl] = useState(initial.base);
  const [rows, setRows] = useState(initial.rows);
  const [freeCount, setFreeCount] = useState(initial.rows === DEFAULT_ROWS || initial.fresh ? 1 : Math.max(0, free));
  const [saving, setSaving] = useState(false);

  const setRow = (i, key) => (e) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: e.target.value } : row)));

  const addRow = () =>
    setRows((r) => {
      // шинэ анги өмнөх ангийн дуусах цагаас эхэлнэ
      const prev = r[r.length - 1];
      return [...r, { own: '', start: prev?.end || '', end: '' }];
    });
  const removeRow = (i) => setRows((r) => (r.length > 1 ? r.filter((_, j) => j !== i) : r));

  const base = url.trim().replace(/#.*$/, '');
  const checked = rows.map((row) => {
    const own = row.own.trim().replace(/#.*$/, '');
    const start = row.start.trim() ? parseClock(row.start) : 0;
    const end = row.end.trim() ? parseClock(row.end) : 0;
    let error = '';
    if (!Number.isFinite(start) || !Number.isFinite(end)) error = 'Цагийг 17:00 эсвэл 1:05:30 гэж бичнэ';
    else if (end && end <= start) error = 'Дуусах цаг эхлэхээс хойш байх ёстой';
    else if (own && isEmbedLink(own)) error = 'embed холбоос биш, .m3u8 хуулна уу';
    else if (!own && !base) error = 'Тусдаа видео эсвэл дээр бүтэн видеоны холбоос оруулна уу';
    return { url: own || base, start, end, error };
  });
  const ok = rows.length > 0 && checked.every((c) => !c.error) && !isEmbedLink(base);
  const freeN = Math.min(rows.length, Math.max(0, Math.round(Number(freeCount) || 0)));

  const apply = async () => {
    setSaving(true);
    try {
      const next = {};
      checked.forEach((c, i) => {
        next[i + 1] = withPart(c.url, c.start, c.end);
      });
      // илүү үлдсэн хуучин ангиудыг устгана
      const maxOld = Math.max(total, ...Object.keys(videos || {}).map(Number), 0);
      for (let ep = rows.length + 1; ep <= maxOld; ep += 1) next[ep] = '';
      await saveEpisodes(seriesId, next);
      await setEpisodeCount(seriesId, rows.length, freeN);
      const kept = Object.fromEntries(Object.entries(next).filter(([, v]) => v));
      toast.success(`${rows.length} анги хадгалагдлаа`);
      onDone(kept, rows.length, freeN);
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Нэг видеог хэд хэдэн анги болгох</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Анги бүрийг тусад нь тохируулна: бүтэн видеоны аль хэсэг (эхлэх – дуусах), эсвэл тусдаа видео. Анги дуусахад дараагийнх нь өөрөө үргэлжилнэ.
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Үндсэн (бүтэн) видео холбоос (.m3u8)"
            helperText="Тусдаа холбоосгүй ангиуд үүнийг ашиглана. Бүх ангид тусдаа холбоос тавьсан бол хоосон орхиж болно."
            size="small"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://vz-xxxx.b-cdn.net/<video-id>/playlist.m3u8"
            error={isEmbedLink(url)}
            fullWidth
          />

          {rows.map((row, i) => {
            const c = checked[i];
            const isFree = i < freeN;
            return (
              <Box
                key={i}
                sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: c.error ? 'error.main' : 'divider', bgcolor: 'background.neutral' }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ flex: 1 }}>
                    {i + 1}-р анги
                  </Typography>
                  <Chip size="small" label={isFree ? 'Үнэгүй' : '🔒 Захиалга'} color={isFree ? 'success' : 'warning'} variant="soft" />
                  <Button size="small" color="inherit" disabled={rows.length <= 1} onClick={() => removeRow(i)} sx={{ minWidth: 0, px: 1 }}>
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </Button>
                </Stack>

                <TextField
                  size="small"
                  fullWidth
                  value={row.own}
                  onChange={setRow(i, 'own')}
                  placeholder="Тусдаа видео холбоос (заавал биш)"
                  helperText={c.error || (row.own.trim() ? 'Энэ анги тусдаа видеогоо доорх цагаар тоглуулна (хоосон = эхнээс нь / төгсгөл хүртэл)' : 'Хоосон бол дээрх бүтэн видеог ашиглана')}
                  error={!!c.error}
                  sx={{ '& input': { fontSize: 13 } }}
                />
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <TextField label="Эхлэх" size="small" value={row.start} onChange={setRow(i, 'start')} placeholder="0:00" sx={{ flex: 1 }} />
                  <TextField label="Дуусах" size="small" value={row.end} onChange={setRow(i, 'end')} placeholder="төгсгөл хүртэл" sx={{ flex: 1 }} />
                </Stack>
              </Box>
            );
          })}

          <Button variant="outlined" color="inherit" onClick={addRow} startIcon={<Iconify icon="mingcute:add-line" />}>
            Анги нэмэх
          </Button>

          <TextField
            label="Үнэгүй анги"
            type="number"
            size="small"
            value={freeCount}
            onChange={(e) => setFreeCount(e.target.value)}
            slotProps={{ htmlInput: { min: 0, max: rows.length } }}
            sx={{ width: 160 }}
          />

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            🔐 Хамгаалалт: үнэгүй ангийг тусад нь Bunny-д оруулаад холбоосыг нь «Тусдаа видео»-д тавина — үнэгүй үзэгч бүтэн киноны холбоосыг огт авахгүй. «Дуусах»-ыг хоосон орхивол видеоны төгсгөл хүртэл тоглоно. Хадмалыг 1-р ангид бүтэн видеоны цагаар оруулахад бүх ангид ажиллана.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Болих
        </Button>
        <Button variant="contained" disabled={!ok} loading={saving} onClick={apply}>
          Хадгалах
        </Button>
      </DialogActions>
    </Dialog>
  );
}
