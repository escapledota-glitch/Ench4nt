import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Fab, { fabClasses } from '@mui/material/Fab';

import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';

import { useCheckoutContext } from '../checkout/context';

// ----------------------------------------------------------------------

export function ProductItem({ product, detailsHref }) {
  const { onAddToCart } = useCheckoutContext();

  const { id, name, coverUrl, price, colors, available, sizes, priceSale, newLabel, saleLabel, totalReviews } = // colors kept for cart
    product;

  const handleAddCart = async () => {
    const newProduct = {
      id,
      name,
      coverUrl,
      available,
      price,
      colors: [colors[0]],
      size: sizes[0],
      quantity: 1,
    };
    try {
      onAddToCart(newProduct);
    } catch (error) {
      console.error(error);
    }
  };

  const renderLabels = () =>
    (newLabel.enabled || saleLabel.enabled) && (
      <Box
        sx={{
          gap: 1,
          top: 16,
          zIndex: 9,
          right: 16,
          display: 'flex',
          position: 'absolute',
          alignItems: 'center',
        }}
      >
        {newLabel.enabled && (
          <Label variant="filled" color="info">
            {newLabel.content}
          </Label>
        )}
        {saleLabel.enabled && (
          <Label variant="filled" color="error">
            {saleLabel.content}
          </Label>
        )}
      </Box>
    );

  const renderImage = () => (
    <Box sx={{ position: 'relative', p: 1 }}>
      {!!available && (
        <Fab
          size="medium"
          color="warning"
          onClick={handleAddCart}
          sx={[
            (theme) => ({
              right: 16,
              zIndex: 9,
              bottom: 16,
              opacity: 0,
              position: 'absolute',
              transform: 'scale(0)',
              transition: theme.transitions.create(['opacity', 'transform'], {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.shorter,
              }),
            }),
          ]}
        >
          <Iconify icon="solar:cart-plus-bold" width={24} />
        </Fab>
      )}

      <Tooltip title={!available && 'Дууссан'} placement="bottom-end">
        <Link component={RouterLink} href={detailsHref} sx={{ display: 'block' }}>
          <Image
            alt={name}
            src={coverUrl}
            ratio="1/1"
            sx={{ borderRadius: 1.5, ...(!available && { opacity: 0.48, filter: 'grayscale(1)' }) }}
          />
        </Link>
      </Tooltip>
    </Box>
  );

  const renderContent = () => (
    <Stack spacing={0.75} sx={{ p: { xs: 1.5, sm: 2 }, pt: { xs: 1, sm: 1.5 } }}>
      <Link component={RouterLink} href={detailsHref} color="inherit" variant="subtitle2" noWrap sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
        {name}
      </Link>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {priceSale && (
          <Box component="span" sx={{ color: 'text.disabled', textDecoration: 'line-through', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
            {fCurrency(priceSale)}
          </Box>
        )}
        <Box component="span" sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '1rem' }, color: priceSale ? 'error.main' : 'text.primary' }}>
          {fCurrency(price)}
        </Box>
      </Box>

      {!!totalReviews && (
        <Box sx={{ typography: 'caption', color: 'text.secondary', fontSize: { xs: '0.62rem', sm: '0.7rem' } }}>
          🛍 {totalReviews}
        </Box>
      )}
    </Stack>
  );

  return (
    <Card
      sx={{
        '&:hover': {
          [`& .${fabClasses.root}`]: { opacity: 1, transform: 'scale(1)' },
        },
      }}
    >
      {renderLabels()}
      {renderImage()}
      {renderContent()}
    </Card>
  );
}
