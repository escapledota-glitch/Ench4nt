'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const GARMENT_TYPES = [
  { id: 'tshirt', label: 'Подволк (T-shirt)' },
  { id: 'hoodie', label: 'Малгайтай цамц (Hoodie)' },
  { id: 'longsleeve', label: 'Цамц (Long sleeve)' },
  { id: 'polo', label: 'Поло (Polo)' },
  { id: 'pants', label: 'Өмд (Pants)' },
  { id: 'shorts', label: 'Шорт (Shorts)' },
];

const EMPTY_FORM = {
  garment_type: 'tshirt',
  color_id: '',
  color_name: '',
  color_hex: '#000000',
  front_url: '',
  back_url: '',
};

// ----------------------------------------------------------------------

function ImageUploadField({ label, value, onChange, folder = 'ench4nt/mockups' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch(`/api/upload?folder=${folder}`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.urls?.[0]) throw new Error(data.error || 'Upload failed');
      onChange(data.urls[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          fullWidth
          placeholder="URL эсвэл доороос upload хийнэ үү"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          component="label"
          variant="outlined"
          size="small"
          disabled={uploading}
          sx={{ whiteSpace: 'nowrap', minWidth: 110 }}
        >
          {uploading ? <CircularProgress size={16} /> : 'Зураг оруулах'}
          <input type="file" accept="image/*" hidden onChange={handleFile} />
        </Button>
      </Stack>
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      )}
      {value && (
        <Box
          component="img"
          src={value}
          alt="preview"
          sx={{ mt: 1, height: 80, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider', background: '#f5f5f5' }}
        />
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

export function MockupManageView() {
  const [mockups, setMockups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchMockups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mockups');
      const data = await res.json();
      setMockups(data.mockups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMockups(); }, [fetchMockups]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      garment_type: row.garment_type,
      color_id: row.color_id,
      color_name: row.color_name,
      color_hex: row.color_hex,
      front_url: row.front_url || '',
      back_url: row.back_url || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/mockups/${editing.id}` : '/api/mockups';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Save failed');
      }
      setDialogOpen(false);
      fetchMockups();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Устгах уу?')) return;
    setDeleteId(id);
    try {
      await fetch(`/api/mockups/${id}`, { method: 'DELETE' });
      fetchMockups();
    } finally {
      setDeleteId(null);
    }
  };

  const garmentLabel = (id) => GARMENT_TYPES.find((g) => g.id === id)?.label || id;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Мокап удирдлага</Typography>
          <Typography variant="body2" color="text.secondary">
            Customizer хуудсанд харагдах хувцасны зургуудыг энд нэмж, засаж, устгана уу.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={openCreate}>
          Шинэ нэмэх
        </Button>
      </Stack>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Хувцасны төрөл</TableCell>
                <TableCell>Өнгөний ID</TableCell>
                <TableCell>Өнгөний нэр</TableCell>
                <TableCell>Өнгө</TableCell>
                <TableCell>Урд зураг</TableCell>
                <TableCell>Ар зураг</TableCell>
                <TableCell align="right">Үйлдэл</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : mockups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Мокап байхгүй байна. "Шинэ нэмэх" дарж эхлүүлнэ үү.
                  </TableCell>
                </TableRow>
              ) : (
                mockups.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{garmentLabel(row.garment_type)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{row.color_id}</Typography>
                    </TableCell>
                    <TableCell>{row.color_name}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 22, height: 22, borderRadius: '50%', background: row.color_hex, border: '1px solid', borderColor: 'divider' }} />
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{row.color_hex}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {row.front_url ? (
                        <Box component="img" src={row.front_url} alt="front" sx={{ height: 48, objectFit: 'contain', borderRadius: 1 }} />
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {row.back_url ? (
                        <Box component="img" src={row.back_url} alt="back" sx={{ height: 48, objectFit: 'contain', borderRadius: 1 }} />
                      ) : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Засах">
                        <IconButton size="small" onClick={() => openEdit(row)}>
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Устгах">
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)} disabled={deleteId === row.id}>
                          {deleteId === row.id ? <CircularProgress size={16} /> : <Iconify icon="solar:trash-bin-trash-bold" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Мокап засах' : 'Шинэ мокап нэмэх'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Хувцасны төрөл</InputLabel>
              <Select
                label="Хувцасны төрөл"
                value={form.garment_type}
                onChange={(e) => setForm((f) => ({ ...f, garment_type: e.target.value }))}
              >
                {GARMENT_TYPES.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{g.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Өнгөний ID (жишээ: black, navy, red)"
              value={form.color_id}
              onChange={(e) => setForm((f) => ({ ...f, color_id: e.target.value.toLowerCase().trim() }))}
              helperText="Жижиг үсгээр, зай байхгүй (black, white, gray, navy, blue, brown, red, yellow, purple)"
            />

            <TextField
              size="small"
              label="Өнгөний нэр (Монгол)"
              value={form.color_name}
              onChange={(e) => setForm((f) => ({ ...f, color_name: e.target.value }))}
              helperText="Жишээ: Хар, Цагаан, Саарал"
            />

            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                size="small"
                label="HEX өнгө"
                value={form.color_hex}
                onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                sx={{ flex: 1 }}
              />
              <Box
                component="input"
                type="color"
                value={form.color_hex}
                onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                style={{ width: 48, height: 40, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }}
              />
            </Stack>

            <ImageUploadField
              label="Урд талын зураг (Front) *"
              value={form.front_url}
              onChange={(url) => setForm((f) => ({ ...f, front_url: url }))}
            />

            <ImageUploadField
              label="Ар талын зураг (Back) — заавал биш"
              value={form.back_url}
              onChange={(url) => setForm((f) => ({ ...f, back_url: url }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Цуцлах</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.color_id || !form.color_name || !form.front_url}
          >
            {saving ? <CircularProgress size={18} /> : 'Хадгалах'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
