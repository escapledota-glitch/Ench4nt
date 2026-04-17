import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  _tags,
  PRODUCT_GENDER_OPTIONS,
  PRODUCT_COLOR_NAME_OPTIONS,
  PRODUCT_CATEGORY_GROUP_OPTIONS,
} from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const ProductCreateSchema = z.object({
  name: z.string().min(1, { error: 'Name is required!' }),
  description: schemaUtils.editor().optional().or(z.string()).optional(),
  images: schemaUtils.files().optional(),
  code: z.string().optional(),
  sku: z.string().optional(),
  quantity: schemaUtils.nullableInput(z.coerce.number().optional()).optional(),
  colors: z.string().array().optional(),
  sizes: z.string().array().optional(),
  tags: z.string().array().optional(),
  gender: z.array(z.string()).optional(),
  price: schemaUtils.nullableInput(z.coerce.number().optional()).optional(),
  category: z.string().optional(),
  subDescription: z.string().optional(),
  taxes: z.coerce.number().nullable().optional(),
  priceSale: z.coerce.number().nullable().optional(),
  saleLabel: z.object({ enabled: z.boolean(), content: z.string() }).optional(),
  newLabel: z.object({ enabled: z.boolean(), content: z.string() }).optional(),
});

// ----------------------------------------------------------------------

export function ProductCreateEditForm({ currentProduct }) {
  const router = useRouter();

  const openDetails = useBoolean(true);
  const openProperties = useBoolean(true);
  const openPricing = useBoolean(true);

  const [includeTaxes, setIncludeTaxes] = useState(false);

  const defaultValues = {
    name: '',
    description: '',
    subDescription: '',
    images: [],
    /********/
    code: '',
    sku: '',
    price: null,
    taxes: null,
    priceSale: null,
    quantity: null,
    tags: [],
    gender: [],
    category: PRODUCT_CATEGORY_GROUP_OPTIONS[0].classify[1],
    colors: [],
    sizes: [],
    newLabel: { enabled: false, content: '' },
    saleLabel: { enabled: false, content: '' },
  };

  const methods = useForm({
    resolver: zodResolver(ProductCreateSchema),
    defaultValues,
    values: currentProduct,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Auto-upload any File objects before saving
      let images = data.images ?? [];
      const newFiles = images.filter((f) => f instanceof File);
      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach((f) => formData.append('files', f));
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Image upload failed');
        }
        const { urls } = await uploadRes.json();
        images = images.map((f) => {
          if (!(f instanceof File)) return f;
          const idx = newFiles.indexOf(f);
          return idx !== -1 ? urls[idx] : f;
        });
      }

      const updatedData = {
        ...data,
        images,
        taxes: includeTaxes ? defaultValues.taxes : data.taxes,
      };

      if (currentProduct?.id) {
        const res = await fetch(`/api/products/${currentProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
        if (!res.ok) throw new Error('Update failed');
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
        if (!res.ok) throw new Error('Create failed');
      }

      reset();
      toast.success(currentProduct ? 'Амжилттай шинэчлэгдлээ!' : 'Бүтээгдэхүүн амжилттай нэмэгдлээ!');
      router.push(paths.dashboard.product.root);
    } catch (error) {
      console.error(error);
      toast.error('Хадгалахад алдаа гарлаа.');
    }
  });

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = values.images && values.images?.filter((file) => file !== inputFile);
      setValue('images', filtered);
    },
    [setValue, values.images]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('images', [], { shouldValidate: true });
  }, [setValue]);

  const handleUploadFiles = useCallback(async () => {
    const currentImages = values.images ?? [];
    // Only upload File objects (not already-saved URL strings)
    const newFiles = currentImages.filter((f) => f instanceof File);
    if (newFiles.length === 0) {
      toast.success('Зураг хадгалагдсан байна!');
      return;
    }

    try {
      const formData = new FormData();
      newFiles.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { urls } = await res.json();

      // Replace File objects with saved URL strings in the form
      const savedUrls = currentImages.map((f) => {
        if (!(f instanceof File)) return f; // already a URL, keep it
        const idx = newFiles.indexOf(f);
        return idx !== -1 ? urls[idx] : f;
      });

      setValue('images', savedUrls, { shouldValidate: true });
      toast.success(`${urls.length} зураг амжилттай хадгалагдлаа!`);
    } catch (err) {
      console.error(err);
      toast.error('Зураг хадгалахад алдаа гарлаа.');
    }
  }, [values.images, setValue]);

  const handleChangeIncludeTaxes = useCallback((event) => {
    setIncludeTaxes(event.target.checked);
  }, []);

  const renderCollapseButton = (value, onToggle) => (
    <IconButton onClick={onToggle}>
      <Iconify icon={value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} />
    </IconButton>
  );

  const renderDetails = () => (
    <Card>
      <CardHeader
        title="Details"
        subheader="Title, short description, image..."
        action={renderCollapseButton(openDetails.value, openDetails.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openDetails.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Field.Text name="name" label="Product name" />

          <Field.Text name="subDescription" label="Sub description" multiline rows={4} />

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Content</Typography>
            <Field.Editor name="description" sx={{ maxHeight: 480 }} />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Images</Typography>
            <Field.Upload
              multiple
              name="images"
              maxSize={10485760}
              onRemove={handleRemoveFile}
              onRemoveAll={handleRemoveAllFiles}
              onUpload={handleUploadFiles}
            />
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderProperties = () => (
    <Card>
      <CardHeader
        title="Properties"
        subheader="Additional functions and attributes..."
        action={renderCollapseButton(openProperties.value, openProperties.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openProperties.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
            }}
          >
            <Field.Text name="code" label="Product code" />

            <Field.Text name="sku" label="Product SKU" />

            <Field.Text
              name="quantity"
              label="Quantity"
              placeholder="0"
              type="number"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Field.Select
              name="category"
              label="Category"
              slotProps={{
                select: { native: true },
                inputLabel: { shrink: true },
              }}
            >
              {PRODUCT_CATEGORY_GROUP_OPTIONS.map((category) => (
                <optgroup key={category.group} label={category.group}>
                  {category.classify.map((classify) => (
                    <option key={classify} value={classify}>
                      {classify}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Field.Select>

            <Field.MultiSelect
              checkbox
              name="colors"
              label="Colors"
              options={PRODUCT_COLOR_NAME_OPTIONS}
            />

            <Field.Autocomplete
              name="sizes"
              label="Sizes"
              placeholder="XS, S, M, L, XL..."
              multiple
              freeSolo
              disableCloseOnSelect
              options={[]}
              getOptionLabel={(option) => option}
              slotProps={{ chip: { size: 'small' } }}
            />
          </Box>

          <Field.Autocomplete
            name="tags"
            label="Tags"
            placeholder="+ Tags"
            multiple
            freeSolo
            disableCloseOnSelect
            options={_tags.map((option) => option)}
            getOptionLabel={(option) => option}
            slotProps={{
              chip: { color: 'info' },
            }}
          />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Gender</Typography>
            <Field.MultiCheckbox
              row
              name="gender"
              options={PRODUCT_GENDER_OPTIONS}
              sx={{ gap: 2 }}
            />
          </Stack>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Box sx={{ gap: 3, display: 'flex', alignItems: 'center' }}>
            <Field.Switch name="saleLabel.enabled" label={null} sx={{ m: 0 }} />
            <Field.Text
              name="saleLabel.content"
              label="Sale label"
              fullWidth
              disabled={!values.saleLabel.enabled}
            />
          </Box>

          <Box sx={{ gap: 3, display: 'flex', alignItems: 'center' }}>
            <Field.Switch name="newLabel.enabled" label={null} sx={{ m: 0 }} />
            <Field.Text
              name="newLabel.content"
              label="New label"
              fullWidth
              disabled={!values.newLabel.enabled}
            />
          </Box>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderPricing = () => (
    <Card>
      <CardHeader
        title="Pricing"
        subheader="Price related inputs"
        action={renderCollapseButton(openPricing.value, openPricing.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openPricing.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Field.Text
            name="price"
            label="Regular price"
            placeholder="0.00"
            type="number"
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 0.75 }}>
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      $
                    </Box>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Field.Text
            name="priceSale"
            label="Sale price"
            placeholder="0.00"
            type="number"
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 0.75 }}>
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      $
                    </Box>
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControlLabel
            control={
              <Switch
                id="toggle-taxes"
                checked={includeTaxes}
                onChange={handleChangeIncludeTaxes}
              />
            }
            label="Price includes taxes"
          />

          {!includeTaxes && (
            <Field.Text
              name="taxes"
              label="Tax (%)"
              placeholder="0.00"
              type="number"
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 0.75 }}>
                      <Box component="span" sx={{ color: 'text.disabled' }}>
                        %
                      </Box>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        </Stack>
      </Collapse>
    </Card>
  );

  const renderActions = () => (
    <Box
      sx={{
        gap: 3,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <FormControlLabel
        label="Publish"
        control={<Switch defaultChecked slotProps={{ input: { id: 'publish-switch' } }} />}
        sx={{ pl: 3, flexGrow: 1 }}
      />

      <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
        {!currentProduct ? 'Create product' : 'Save changes'}
      </Button>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails()}
        {renderProperties()}
        {renderPricing()}
        {renderActions()}
      </Stack>
    </Form>
  );
}
