import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { OrderCompleteIllustration } from 'src/assets/illustrations';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CheckoutOrderComplete({ onResetCart, onDownloadPDF, slotProps, ...other }) {
  const dialogPaperSx = slotProps?.paper?.sx;

  return (
    <Dialog
      fullWidth
      fullScreen
      slotProps={{
        ...slotProps,
        paper: {
          ...slotProps?.paper,
          sx: [
            {
              width: { md: `calc(100% - 48px)` },
              height: { md: `calc(100% - 48px)` },
            },
            ...(Array.isArray(dialogPaperSx) ? dialogPaperSx : [dialogPaperSx]),
          ],
        },
      }}
      {...other}
    >
      <Box
        sx={{
          py: 5,
          gap: 5,
          m: 'auto',
          maxWidth: 480,
          display: 'flex',
          textAlign: 'center',
          alignItems: 'center',
          px: { xs: 2, sm: 0 },
          flexDirection: 'column',
        }}
      >
        <Typography variant="h4">Захиалга амжилттай!</Typography>

        <OrderCompleteIllustration />

        <Typography sx={{ color: 'text.secondary' }}>
          Таны захиалга Messenger-т илгээгдлээ.
          <br />
          <br />
          Бид тантай удахгүй холбогдох болно. Асуулт байвал манай Facebook хуудсаар холбогдоно уу.
        </Typography>

        <Divider sx={{ width: 1, borderStyle: 'dashed' }} />

        <Button
          component={RouterLink}
          href={paths.product.root}
          size="large"
          color="inherit"
          variant="outlined"
          onClick={onResetCart}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
        >
          Дэлгүүр үргэлжлүүлэх
        </Button>
      </Box>
    </Dialog>
  );
}
