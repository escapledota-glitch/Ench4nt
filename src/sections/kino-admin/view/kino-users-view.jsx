'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Menu from '@mui/material/Menu';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { formatDate } from 'src/sections/drama/drama-auth';
import { PLANS, planName } from 'src/sections/drama/drama-data';

import { grantPlan, errorText, listUsers, cancelPlan } from '../kino-api';

// ----------------------------------------------------------------------

const isActive = (u) => u.plan && u.expires_at && new Date(u.expires_at) > new Date();

export function KinoUsersView() {
  const [rows, setRows] = useState(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [menu, setMenu] = useState(null); // { anchor, user }

  const load = useCallback(() => {
    listUsers()
      .then(setRows)
      .catch((e) => {
        toast.error(errorText(e));
        setRows([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, msg) => {
    const u = menu.user;
    setMenu(null);
    try {
      await fn(u.id);
      toast.success(msg);
      load();
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = (rows ?? [])
    .filter((u) => (tab === 'all' ? true : tab === 'active' ? isActive(u) : !isActive(u)))
    .filter((u) => !q || u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q));
  const counts = {
    all: rows?.length ?? 0,
    active: rows?.filter(isActive).length ?? 0,
    free: rows?.filter((u) => !isActive(u)).length ?? 0,
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Хэрэглэгчид"
        links={[{ name: '444 Кино', href: '/dashboard/kino' }, { name: 'Хэрэглэгчид' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setPage(0);
          }}
          sx={{ px: 2.5 }}
        >
          {[
            ['all', 'Бүгд', 'default'],
            ['active', 'Багцтай', 'success'],
            ['free', 'Үнэгүй', 'default'],
          ].map(([v, label, color]) => (
            <Tab
              key={v}
              value={v}
              iconPosition="end"
              label={label}
              icon={
                <Label variant={tab === v ? 'filled' : 'soft'} color={color}>
                  {counts[v]}
                </Label>
              }
            />
          ))}
        </Tabs>
        <Divider />

        <Box sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Нэр, имэйлээр хайх…"
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
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Хэрэглэгч</TableCell>
                <TableCell>Бүртгүүлсэн</TableCell>
                <TableCell>Сүүлд орсон</TableCell>
                <TableCell>Багц</TableCell>
                <TableCell>Дуусах</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((u) => {
                const active = isActive(u);
                return (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ width: 36, height: 36 }}>{(u.name || u.email || '?').charAt(0).toUpperCase()}</Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {u.name} {u.is_admin && <Label color="warning" sx={{ ml: 0.5 }}>Админ</Label>}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                            {u.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{formatDate(u.created_at)}</TableCell>
                    <TableCell>{u.last_sign_in_at ? formatDate(u.last_sign_in_at) : '—'}</TableCell>
                    <TableCell>
                      {u.plan ? (
                        <Label color={active ? 'success' : 'default'} variant="soft">
                          {planName(u.plan)}
                          {!active && ' (дууссан)'}
                        </Label>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                          Үнэгүй
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{u.expires_at ? formatDate(u.expires_at) : '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => setMenu({ anchor: e.currentTarget, user: u })}>
                        <Iconify icon="eva:more-vertical-fill" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows !== null && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Хэрэглэгч олдсонгүй
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100]}
          labelRowsPerPage="Хуудсанд:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        />
      </Card>

      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
        <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
          Багц өгөх / сунгах
        </Typography>
        {PLANS.map((p) => (
          <MenuItem key={p.id} onClick={() => act((uid) => grantPlan(uid, p.id), `${p.name} багц олголоо`)}>
            <Iconify icon="solar:crown-bold" sx={{ mr: 1, color: 'warning.main' }} />
            {p.name}
          </MenuItem>
        ))}
        {menu?.user && isActive(menu.user) && [
          <Divider key="d" />,
          <MenuItem key="c" sx={{ color: 'error.main' }} onClick={() => act(cancelPlan, 'Багц цуцаллаа')}>
            <Iconify icon="solar:close-circle-bold" sx={{ mr: 1 }} />
            Багц цуцлах
          </MenuItem>,
        ]}
      </Menu>
    </DashboardContent>
  );
}
