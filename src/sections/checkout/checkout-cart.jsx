import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';

import { CONFIG } from 'src/global-config';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { useCheckoutContext } from './context';
import { CheckoutSummary } from './checkout-summary';
import { CheckoutCartProductList } from './checkout-cart-product-list';

// ----------------------------------------------------------------------

const MESSENGER_URL = 'https://www.messenger.com/t/100718614798925';

// ----------------------------------------------------------------------

export function CheckoutCart() {
  const {
    loading,
    onResetCart,
    onChangeStep,
    onApplyDiscount,
    onDeleteCartItem,
    state: checkoutState,
    onChangeItemQuantity,
  } = useCheckoutContext();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isCartEmpty = !checkoutState.items.length;
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

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
    } catch {
      // fallback: select text manually
    }
    setCopied(true);
    toast.success('Мессеж хуулагдлаа! Одоо Messenger-т буулгана уу.');
  }, [fullMessage]);

  const handleOpenMessenger = () => {
    window.open(MESSENGER_URL, '_blank');
    onResetCart();
    onChangeStep('next');
    setOpen(false);
    setCopied(false);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setCopied(false);
  };

  const renderLoading = () => (
    <Box sx={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LinearProgress color="inherit" sx={{ width: 1, maxWidth: 320 }} />
    </Box>
  );

  const renderEmpty = () => (
    <EmptyContent
      title="Сагс хоосон байна!"
      description="Та одоогоор ямар ч бараа сонгоогүй байна."
      imgUrl={`${CONFIG.assetsDir}/assets/icons/empty/ic-cart.svg`}
      sx={{ height: 340 }}
    />
  );

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title={
                <Typography variant="h6">
                  {`Сагс `}
                  <Typography component="span" sx={{ color: 'text.secondary' }}>
                    ({checkoutState.totalItems} бараа)
                  </Typography>
                </Typography>
              }
              sx={{ mb: 3 }}
            />

            {loading ? (
              renderLoading()
            ) : (
              <>
                {isCartEmpty ? (
                  renderEmpty()
                ) : (
                  <CheckoutCartProductList
                    checkoutState={checkoutState}
                    onDeleteCartItem={onDeleteCartItem}
                    onChangeItemQuantity={onChangeItemQuantity}
                  />
                )}
              </>
            )}
          </Card>

          <Button
            component={RouterLink}
            href={paths.product.root}
            color="inherit"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Дэлгүүр үргэлжлүүлэх
          </Button>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <CheckoutSummary checkoutState={checkoutState} onApplyDiscount={onApplyDiscount} />

          <Button
            fullWidth
            size="large"
            variant="contained"
            color="primary"
            disabled={isCartEmpty}
            onClick={() => setOpen(true)}
            startIcon={<Iconify icon="logos:messenger" width={22} />}
            sx={{ mt: 2, py: 1.8, fontSize: '1rem', fontWeight: 700 }}
          >
            Худалдан авах
          </Button>
        </Grid>
      </Grid>

      {/* Confirm dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Захиалгаа баталгаажуулах</DialogTitle>
        <DialogContent>
          <Stack spacing={2} divider={<Divider />} sx={{ mb: 2 }}>
            {items.map((item, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {item.coverUrl && (
                  <Avatar
                    src={item.coverUrl}
                    variant="rounded"
                    sx={{ width: 48, height: 48, flexShrink: 0 }}
                  />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">{item.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Хэмжээ: {item.size ?? '-'} · Тоо: {item.quantity}
                  </Typography>
                </Box>
                <Typography variant="subtitle2">{fCurrency(item.price * item.quantity)}</Typography>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ mb: 1.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1">Нийт дүн</Typography>
            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700 }}>
              {fCurrency(checkoutState.total)}
            </Typography>
          </Box>

          {/* Step instructions */}
          <Stack spacing={1.5}>
            {/* Step 1 */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: copied ? 'success.main' : 'divider',
                bgcolor: copied ? 'success.lighter' : 'action.hover',
                transition: 'all 0.3s',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                1-р алхам
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                Захиалгын мэдээллийг хуулна уу
              </Typography>
              <Button
                fullWidth
                size="small"
                variant={copied ? 'soft' : 'outlined'}
                color={copied ? 'success' : 'inherit'}
                onClick={handleCopy}
                startIcon={<Iconify icon={copied ? 'eva:checkmark-fill' : 'eva:copy-fill'} width={16} />}
              >
                {copied ? 'Хуулагдлаа ✓' : 'Мессеж хуулах'}
              </Button>
            </Box>

            {/* Step 2 */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: copied ? 'primary.main' : 'divider',
                bgcolor: copied ? 'primary.lighter' : 'action.hover',
                opacity: copied ? 1 : 0.5,
                transition: 'all 0.3s',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                2-р алхам
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                Messenger нээгээд мессежийг буулгаж илгээнэ үү
              </Typography>
              <Button
                fullWidth
                size="small"
                variant="contained"
                color="primary"
                disabled={!copied}
                onClick={handleOpenMessenger}
                startIcon={<Iconify icon="logos:messenger" width={16} />}
              >
                Messenger нээх
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={handleCloseDialog}>
            Болих
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
