'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { formatDate } from 'src/sections/drama/drama-auth';

import { errorText, listSeries, sendNotification, listNotifications, deleteNotification } from '../kino-api';

// ----------------------------------------------------------------------

const TEMPLATES = [
  { label: 'Шинэ анги', title: '🎬 Шинэ анги гарлаа!', body: '{нэр} цувралын шинэ анги нэмэгдлээ. Яг одоо үзээрэй!' },
  { label: 'Шинэ цуврал', title: '✨ Шинэ цуврал', body: '{нэр} — 444 Кино-д шинээр нэмэгдлээ. Эхний ангиуд үнэгүй!' },
  { label: 'Хямдрал', title: '🔥 Хямдрал', body: 'Өнөөдөр л: 1 сарын багц хямдралтай. Бүх цувралыг хязгааргүй үзээрэй.' },
];

export function KinoNotificationsView() {
  const [series, setSeries] = useState([]);
  const [history, setHistory] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', url: '/drama/', seriesId: '' });
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    listNotifications()
      .then(setHistory)
      .catch((e) => {
        toast.error(errorText(e));
        setHistory([]);
      });
  }, []);

  useEffect(() => {
    load();
    listSeries().then(setSeries).catch(() => {});
  }, [load]);

  const pickSeries = (id) => {
    const s = series.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      seriesId: id,
      url: s ? `/drama/${s.id}/` : '/drama/',
      body: s ? f.body.replace('{нэр}', s.title) : f.body,
    }));
  };

  const applyTemplate = (t) => {
    const s = series.find((x) => x.id === form.seriesId);
    setForm((f) => ({ ...f, title: t.title, body: s ? t.body.replace('{нэр}', s.title) : t.body }));
  };

  const send = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Гарчиг оруулна уу');
    setSending(true);
    try {
      const r = await sendNotification({ title: form.title, body: form.body, url: form.url });
      toast.success(`Илгээлээ: ${r.sent} төхөөрөмж${r.failed ? `, ${r.failed} амжилтгүй` : ''}`);
      setForm({ title: '', body: '', url: '/drama/', seriesId: '' });
      load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSending(false);
    }
    return undefined;
  };

  const remove = async (id) => {
    try {
      await deleteNotification(id);
      setHistory((h) => h.filter((n) => n.id !== id));
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Мэдэгдэл"
        links={[{ name: '444 Кино', href: '/dashboard/kino' }, { name: 'Мэдэгдэл' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
        <Card component="form" onSubmit={send} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Шинэ мэдэгдэл
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
            Мэдэгдэл асаасан бүх утас руу очиж, сайтын 🔔 хэсэгт харагдана.
          </Typography>

          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
            {TEMPLATES.map((t) => (
              <Button key={t.label} size="small" variant="soft" onClick={() => applyTemplate(t)}>
                {t.label}
              </Button>
            ))}
          </Stack>

          <Stack spacing={2.5}>
            <TextField select label="Цуврал (заавал биш)" value={form.seriesId} onChange={(e) => pickSeries(e.target.value)}>
              <MenuItem value="">— Сонгохгүй —</MenuItem>
              {series.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Гарчиг" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} slotProps={{ htmlInput: { maxLength: 120 } }} required />
            <TextField label="Текст" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} multiline minRows={3} slotProps={{ htmlInput: { maxLength: 400 } }} />
            <TextField label="Дарахад нээгдэх хуудас" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} helperText="Ж: /drama/ эсвэл /drama/plans/" />

            {/* Урьдчилан харах */}
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.neutral', display: 'flex', gap: 1.5 }}>
              <Box component="img" src="/kino/icon-192.png" alt="" sx={{ width: 40, height: 40, borderRadius: 1 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">{form.title || 'Гарчиг'}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {form.body || 'Мэдэгдлийн текст…'}
                </Typography>
              </Box>
            </Box>

            <Button type="submit" variant="contained" size="large" loading={sending} startIcon={<Iconify icon="solar:plain-bold" />}>
              Илгээх
            </Button>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Илгээсэн
          </Typography>
          {history === null && <LinearProgress />}
          {history?.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
              Одоогоор мэдэгдэл илгээгээгүй байна
            </Typography>
          )}
          <Stack spacing={1.5}>
            {history?.map((n) => (
              <Box key={n.id} sx={{ p: 1.5, borderRadius: 1.5, border: (t) => `1px solid ${t.vars.palette.divider}`, display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2">{n.title}</Typography>
                  {n.body && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {n.body}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {formatDate(n.created_at)} {n.url && `· ${n.url}`}
                  </Typography>
                </Box>
                <IconButton size="small" color="error" onClick={() => remove(n.id)} title="Жагсаалтаас устгах">
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </Card>
      </Box>
    </DashboardContent>
  );
}
