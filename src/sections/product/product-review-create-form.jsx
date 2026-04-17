import * as z from 'zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const ProductReviewCreateSchema = z.object({
  rating: z.number().min(1, 'Үнэлгээ өгнө үү!'),
  name: z.string().min(1, { error: 'Нэр оруулна уу!' }),
  review: z.string().min(1, { error: 'Сэтгэгдэл оруулна уу!' }),
  email: schemaUtils.email(),
});

// ----------------------------------------------------------------------

export function ProductReviewCreateForm({ onClose, productId, onReviewSubmitted, sx, ...other }) {
  const defaultValues = { rating: 0, review: '', name: '', email: '' };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(ProductReviewCreateSchema),
    defaultValues,
  });

  const { reset, handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (productId) {
        const res = await fetch(`/api/products/${productId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed');
      }
      reset();
      onClose();
      toast.success('Сэтгэгдэл амжилттай нэмэгдлээ!');
      onReviewSubmitted?.();
    } catch (error) {
      console.error(error);
      toast.error('Сэтгэгдэл нэмэхэд алдаа гарлаа.');
    }
  });

  const onCancel = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  return (
    <Dialog onClose={onClose} sx={sx} {...other}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Сэтгэгдэл бичих</DialogTitle>

        <DialogContent>
          <div>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Энэ бүтээгдэхүүний талаар үнэлгээ өгнө үү:
            </Typography>
            <Field.Rating name="rating" />
          </div>

          <Field.Text name="review" label="Сэтгэгдэл *" multiline rows={3} sx={{ mt: 3 }} />
          <Field.Text name="name" label="Нэр *" sx={{ mt: 3 }} />
          <Field.Text name="email" label="И-мэйл *" sx={{ mt: 3 }} />
        </DialogContent>

        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={onCancel}>
            Болих
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Нийтлэх
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
