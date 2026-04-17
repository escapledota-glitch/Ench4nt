'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { paths } from 'src/routes/paths';

import { ProductItem } from './product-item';
import { ProductItemSkeleton } from './product-skeleton';

// ----------------------------------------------------------------------

const PER_PAGE = 12;

export function ProductList({ products, loading, sx, ...other }) {
  const [page, setPage] = useState(1);

  const pageCount = Math.ceil((products?.length || 0) / PER_PAGE);
  const paged = products?.slice((page - 1) * PER_PAGE, page * PER_PAGE) || [];

  const renderLoading = () => <ProductItemSkeleton />;

  const renderList = () =>
    paged.map((product) => (
      <ProductItem
        key={product.id}
        product={product}
        detailsHref={paths.product.details(product.id)}
      />
    ));

  return (
    <>
      <Box
        sx={[
          {
            gap: { xs: 1.5, sm: 3 },
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {loading ? renderLoading() : renderList()}
      </Box>

      {pageCount > 1 && (
        <Pagination
          count={pageCount}
          page={page}
          onChange={(_, value) => {
            setPage(value);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          sx={{
            mt: { xs: 5, md: 8 },
            [`& .${paginationClasses.ul}`]: { justifyContent: 'center' },
          }}
        />
      )}
    </>
  );
}
