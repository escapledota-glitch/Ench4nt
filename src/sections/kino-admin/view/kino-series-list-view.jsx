'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { errorText, listSeries, deleteSeries, setPublished } from '../kino-api';

// ----------------------------------------------------------------------

export function KinoSeriesListView() {
  const [rows, setRows] = useState(null);
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(() => {
    listSeries()
      .then(setRows)
      .catch((e) => {
        toast.error(errorText(e));
        setRows([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const togglePublished = async (row) => {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, published: !r.published } : r)));
    try {
      await setPublished(row.id, !row.published);
      toast.success(row.published ? 'Нуулаа' : 'Нийтэллээ');
    } catch (e) {
      toast.error(errorText(e));
      load();
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteSeries(toDelete.id);
      toast.success('Устгалаа');
      setToDelete(null);
      load();
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = (rows ?? []).filter((r) => !q || r.title.toLowerCase().includes(q) || r.id.includes(q));

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Цуврал"
        links={[{ name: '444 Кино', href: '/dashboard/kino' }, { name: 'Цуврал' }]}
        action={
          <Button variant="contained" href="/dashboard/kino/series/new" startIcon={<Iconify icon="mingcute:add-line" />}>
            Шинэ цуврал
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Box sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Нэрээр хайх…"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {rows === null && <LinearProgress />}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Цуврал</TableCell>
                <TableCell>Төрөл</TableCell>
                <TableCell align="center">Анги</TableCell>
                <TableCell align="center">Үнэгүй</TableCell>
                <TableCell align="center">Нийтлэгдсэн</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <Box component="img" src={r.poster} alt="" sx={{ width: 42, height: 56, borderRadius: 1, objectFit: 'cover', bgcolor: 'background.neutral', flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {r.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          /{r.id}
                        </Typography>
                      </Box>
                      {r.badge && (
                        <Label color={r.badge === 'Топ' ? 'error' : 'info'} variant="soft">
                          {r.badge}
                        </Label>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {(r.genres ?? []).join(', ')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{r.episodes}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    {r.free_episodes} анги{r.free_minutes ? ` + ${r.free_minutes} мин` : ""}
                  </TableCell>
                  <TableCell align="center">
                    <Switch checked={r.published} onChange={() => togglePublished(r)} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton href={`/drama/${r.id}`} target="_blank" title="Сайт дээр харах">
                      <Iconify icon="solar:eye-bold" />
                    </IconButton>
                    <IconButton href={`/dashboard/kino/series/${r.id}`} title="Засах">
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton color="error" onClick={() => setToDelete(r)} title="Устгах">
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {rows !== null && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Цуврал олдсонгүй
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Устгах уу?</DialogTitle>
        <DialogContent>
          <Typography>
            <b>{toDelete?.title}</b> цуврал болон бүх ангийн холбоос устгагдана. Буцаах боломжгүй.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setToDelete(null)}>
            Болих
          </Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Устгах
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
