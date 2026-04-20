'use client';

import useSWR, { mutate } from 'swr';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

const fetcher = (url) => fetch(url).then((r) => r.json());

const STATUS_OPTIONS = ['pending', 'in_progress', 'done', 'delivered'];

const STATUS_COLORS = {
  pending: 'warning',
  in_progress: 'info',
  done: 'success',
  delivered: 'default',
};

const STATUS_LABELS = {
  pending: 'Хүлээгдэж буй',
  in_progress: 'Хийгдэж байна',
  done: 'Дууссан',
  delivered: 'Хүргэгдсэн',
};

const GARMENT_LABELS = {
  tshirt: 'Подволк',
  hoodie: 'Худи',
  longsleeve: 'Цамц',
  polo: 'Поло',
  pants: 'Өмд',
  shorts: 'Шорт',
};

export function OrdersView() {
  const { data, isLoading } = useSWR('/api/orders', fetcher);
  const orders = data?.orders || [];

  const [selected, setSelected] = useState([]);
  const [preview, setPreview] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = () =>
    setSelected(selected.length === orders.length ? [] : orders.map((o) => o.id));

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await mutate('/api/orders');
    setUpdatingId(null);
  };

  const handleDeleteSelected = async () => {
    if (!selected.length) return;
    if (!window.confirm(`${selected.length} захиалга устгах уу?`)) return;
    await fetch('/api/orders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected }),
    });
    setSelected([]);
    await mutate('/api/orders');
  };

  const handleDeleteOne = async (id) => {
    if (!window.confirm('Захиалга устгах уу?')) return;
    await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    await mutate('/api/orders');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Захиалгууд
        </Typography>
        {selected.length > 0 && (
          <Tooltip title={`${selected.length} захиалга устгах`}>
            <IconButton color="error" onClick={handleDeleteSelected}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Iconify icon="solar:box-minimalistic-broken" width={48} sx={{ mb: 1, opacity: 0.4 }} />
          <Typography>Захиалга байхгүй байна</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < orders.length}
                    checked={selected.length === orders.length && orders.length > 0}
                    onChange={toggleAll}
                  />
                </TableCell>
                <TableCell>Дизайн</TableCell>
                <TableCell>Харилцагч</TableCell>
                <TableCell>Хувцас</TableCell>
                <TableCell>Хэмжээ / Тоо</TableCell>
                <TableCell>Огноо</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} selected={selected.includes(order.id)} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(order.id)}
                      onChange={() => toggleSelect(order.id)}
                    />
                  </TableCell>

                  {/* Design thumbnail */}
                  <TableCell>
                    {order.design_url ? (
                      <Avatar
                        src={order.design_url}
                        variant="rounded"
                        sx={{ width: 52, height: 52, cursor: 'pointer', border: '1px solid rgba(155,48,255,0.3)' }}
                        onClick={() => setPreview(order.design_url)}
                      />
                    ) : (
                      <Avatar variant="rounded" sx={{ width: 52, height: 52, bgcolor: 'action.hover' }}>
                        <Iconify icon="solar:image-broken" width={24} />
                      </Avatar>
                    )}
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{order.customer_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{order.customer_phone}</Typography>
                    {order.notes && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.notes}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Garment */}
                  <TableCell>
                    <Typography variant="body2">{GARMENT_LABELS[order.garment_type] || order.garment_type}</Typography>
                    {order.color && (
                      <Typography variant="caption" color="text.secondary">{order.color}</Typography>
                    )}
                  </TableCell>

                  {/* Size / Qty */}
                  <TableCell>
                    <Typography variant="body2">{order.size} × {order.quantity}</Typography>
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.created_at).toLocaleDateString('mn-MN')}
                    </Typography>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={order.status || 'pending'}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                      sx={{ minWidth: 140 }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s} value={s}>
                          <Chip label={STATUS_LABELS[s]} color={STATUS_COLORS[s]} size="small" />
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right">
                    <Tooltip title="Устгах">
                      <IconButton size="small" color="error" onClick={() => handleDeleteOne(order.id)}>
                        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Image preview modal */}
      {preview && (
        <Box
          onClick={() => setPreview(null)}
          sx={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, cursor: 'zoom-out',
          }}
        >
          <Box
            component="img"
            src={preview}
            sx={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 2, boxShadow: '0 0 60px rgba(155,48,255,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          />
        </Box>
      )}
    </Box>
  );
}
