'use client';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CheckoutCart } from '../checkout-cart';
import { useCheckoutContext } from '../context';
import { CheckoutOrderComplete } from '../checkout-order-complete';

// ----------------------------------------------------------------------

export function CheckoutView() {
  const { completed, onResetCart } = useCheckoutContext();

  return (
    <Container sx={{ mb: 10 }}>
      <Typography variant="h4" sx={{ my: { xs: 3, md: 5 } }}>
        Сагс
      </Typography>

      {completed ? (
        <CheckoutOrderComplete open onResetCart={onResetCart} onDownloadPDF={() => {}} />
      ) : (
        <CheckoutCart />
      )}
    </Container>
  );
}
