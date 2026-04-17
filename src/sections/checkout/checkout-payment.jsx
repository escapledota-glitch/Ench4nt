'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fCurrency } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useCheckoutContext } from './context';
import { CheckoutSummary } from './checkout-summary';

// ----------------------------------------------------------------------

const MESSENGER_URL = 'https://www.messenger.com/t/100718614798925';

// ----------------------------------------------------------------------

export function CheckoutPayment() {
  const { onResetCart, onChangeStep, state: checkoutState } = useCheckoutContext();
  const [open, setOpen] = useState(false);

  const items = checkoutState.items || [];

  const orderText = items
    .map(
      (item) =>
        `📦 Бүтээгдэхүүн: ${item.name}\n` +
        `🎨 Өнгө: ${item.colors?.[0] ?? '-'}\n` +
        `📐 Хэмжээ: ${item.size ?? '-'}\n` +
        `🔢 Тоо: ${item.quantity}\n` +
        `💰 Үнэ: ${fCurrency(item.price)}`
    )
    .join('\n\n');

  const fullMessage =
    `🛒 ШИНЭ ЗАХИАЛГА — ENCH4NT STUDIO\n` +
    `${'─'.repeat(30)}\n` +
    `${orderText}\n` +
    `${'─'.repeat(30)}\n` +
    `💵 Нийт дүн: ${fCurrency(checkoutState.total)}\n` +
    `📅 Огноо: ${new Date().toLocaleDateString('mn-MN')}`;

  const handleBuy = async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
    } catch {
      // clipboard may not be available on some browsers
    }
    window.open(MESSENGER_URL, '_blank');
    onResetCart();
    onChangeStep('next');
    setOpen(false);
    toast.success('Захиалга амжилттай! Messenger-т мэдэгдэл илгээгдлээ.');
  };

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Order items preview */}
          <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Захиалгын дэлгэрэнгүй
            </Typography>

            <Stack spacing={2} divider={<Divider />}>
              {items.map((item, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {item.coverUrl && (
                    <Box
                      component="img"
                      src={item.coverUrl}
                      sx={{ width: 56, height: 56, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Хэмжээ: {item.size ?? '-'} · Тоо: {item.quantity}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1">{fCurrency(item.price * item.quantity)}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2, mb: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              Захиалга хийхэд дараах мэдээлэл манай Messenger хуудас руу автоматаар илгээгдэнэ. Та зөвхөн нэг дарахад л болно.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="logos:messenger" width={20} />
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                messenger.com/t/Ench4nt Studio
              </Typography>
            </Box>
          </Box>

          <Button
            color="inherit"
            onClick={() => onChangeStep('back')}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Буцах
          </Button>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <CheckoutSummary checkoutState={checkoutState} />

          <Button
            fullWidth
            size="large"
            variant="contained"
            color="primary"
            onClick={() => setOpen(true)}
            startIcon={<Iconify icon="logos:messenger" width={22} />}
            sx={{ mt: 2, py: 1.8, fontSize: '1rem', fontWeight: 700 }}
          >
            Худалдан авах
          </Button>
        </Grid>
      </Grid>

      {/* Confirm dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Захиалгаа баталгаажуулах</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Доорх мэдээлэл Messenger-т илгээгдэнэ:
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
              fontSize: '0.78rem',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              wordBreak: 'break-word',
            }}
          >
            {fullMessage}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setOpen(false)}>
            Болих
          </Button>
          <Button
            variant="contained"
            onClick={handleBuy}
            startIcon={<Iconify icon="logos:messenger" width={18} />}
          >
            Messenger-ээр захиалах
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
