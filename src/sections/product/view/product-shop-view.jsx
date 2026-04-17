'use client';

import { useState } from 'react';
import { orderBy } from 'es-toolkit';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { EmptyContent } from 'src/components/empty-content';

import { CartIcon } from '../cart-icon';
import { ProductList } from '../product-list';
import { ProductSort } from '../product-sort';
import { ProductSearch } from '../product-search';
import { useCheckoutContext } from '../../checkout/context';

// ----------------------------------------------------------------------

const SORT_OPTIONS = [
  { value: 'newest', label: 'Шинэ' },
  { value: 'priceAsc', label: 'Үнэ: Бага → Их' },
  { value: 'priceDesc', label: 'Үнэ: Их → Бага' },
  { value: 'rating', label: 'Үнэлгээ' },
];

// ----------------------------------------------------------------------

export function ProductShopView({ products }) {
  const { state: checkoutState } = useCheckoutContext();
  const [sortBy, setSortBy] = useState('newest');

  const dataFiltered = applySort(products, sortBy);
  const isEmpty = !products.length;

  return (
    <>
      <CartIcon totalItems={checkoutState.totalItems} />

      <Container sx={{ mb: 10 }}>
        <Typography variant="h4" sx={{ mb: 3, mt: { xs: 1, md: 3 } }}>
          Дэлгүүр
        </Typography>

        <Box
          sx={{
            mb: { xs: 3, md: 5 },
            gap: 2,
            display: 'flex',
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <ProductSearch redirectPath={(id) => paths.product.details(id)} />

          <ProductSort
            sort={sortBy}
            onSort={(newValue) => setSortBy(newValue)}
            sortOptions={SORT_OPTIONS}
          />
        </Box>

        {isEmpty ? (
          <EmptyContent filled sx={{ py: 10 }} />
        ) : (
          <ProductList products={dataFiltered} />
        )}
      </Container>
    </>
  );
}

// ----------------------------------------------------------------------

function applySort(products, sortBy) {
  if (sortBy === 'newest') return orderBy(products, ['createdAt'], ['desc']);
  if (sortBy === 'priceAsc') return orderBy(products, ['price'], ['asc']);
  if (sortBy === 'priceDesc') return orderBy(products, ['price'], ['desc']);
  if (sortBy === 'rating') return orderBy(products, ['totalRatings'], ['desc']);
  return products;
}
