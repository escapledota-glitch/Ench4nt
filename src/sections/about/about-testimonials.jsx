'use client';

import useSWR from 'swr';
import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Masonry from '@mui/lab/Masonry';
import Rating from '@mui/material/Rating';
import Avatar from '@mui/material/Avatar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fDate } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

const fetcher = (url) => fetch(url).then((r) => r.json());

export function AboutTestimonials({ sx, ...other }) {
  const { data: products = [] } = useSWR('/api/products', fetcher);

  const reviews = products.flatMap((p) =>
    (p.reviews || []).map((r) => ({
      name: r.name,
      content: r.comment,
      ratingNumber: r.rating,
      postedDate: r.postedAt,
      avatarUrl: r.avatarUrl || '',
      productName: p.name,
    }))
  );

  const renderDescription = () => (
    <Box sx={{ maxWidth: { md: 360 }, textAlign: { xs: 'center', md: 'unset' } }}>
      <m.div variants={varFade('inUp')}>
        <Typography variant="overline" sx={{ color: 'common.white', opacity: 0.48 }}>
          Сэтгэгдэл
        </Typography>
      </m.div>

      <m.div variants={varFade('inUp')}>
        <Typography variant="h2" sx={{ my: 3, color: 'common.white' }}>
          Хэрэглэгчдийн <br />
          сэтгэгдэл
        </Typography>
      </m.div>

      <m.div variants={varFade('inUp')}>
        <Typography sx={{ color: 'common.white' }}>
          Бидний зорилго бол таны өдөр бүр ашиглах, сэтгэл ханамжтай байх бүтээгдэхүүн бүтээх юм.
          Тиймээс бид үйлчилгээгээ байнга сайжруулж, хэрэглэгчдийнхээ санал хүсэлтийг анхааран
          ажилладаг.
        </Typography>
      </m.div>
    </Box>
  );

  const renderContent = () => (
    <Box
      sx={[
        (theme) => ({
          ...theme.mixins.hideScrollY,
          py: { md: 10 },
          height: { md: 1 },
          overflowY: { xs: 'unset', md: 'auto' },
        }),
      ]}
    >
      <Masonry spacing={3} columns={{ xs: 1, md: 2 }} sx={{ ml: 0 }}>
        {reviews.length > 0 ? (
          reviews.map((review, i) => (
            <m.div key={i} variants={varFade('inUp')}>
              <TestimonialItem testimonial={review} />
            </m.div>
          ))
        ) : (
          <m.div variants={varFade('inUp')}>
            <Typography sx={{ color: 'common.white', opacity: 0.6 }}>
              Одоогоор сэтгэгдэл байхгүй байна.
            </Typography>
          </m.div>
        )}
      </Masonry>
    </Box>
  );

  return (
    <Box
      component="section"
      sx={[
        (theme) => ({
          ...theme.mixins.bgGradient({
            images: [
              `linear-gradient(0deg, ${varAlpha(theme.vars.palette.grey['900Channel'], 0.9)}, ${varAlpha(theme.vars.palette.grey['900Channel'], 0.9)})`,
              `url(${CONFIG.assetsDir}/assets/images/about/testimonials.webp)`,
            ],
          }),
          overflow: 'hidden',
          height: { md: 840 },
          py: { xs: 10, md: 0 },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Container component={MotionViewport} sx={{ position: 'relative', height: 1 }}>
        <Grid
          container
          spacing={3}
          sx={{
            height: 1,
            alignItems: 'center',
            justifyContent: { xs: 'center', md: 'space-between' },
          }}
        >
          <Grid size={{ xs: 10, md: 4 }}>{renderDescription()}</Grid>

          <Grid size={{ xs: 12, md: 7, lg: 6 }} sx={{ height: 1, alignItems: 'center' }}>
            {renderContent()}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

// ----------------------------------------------------------------------

function TestimonialItem({ testimonial, sx, ...other }) {
  return (
    <Box
      sx={[
        (theme) => ({
          ...theme.mixins.bgBlur({ color: varAlpha(theme.vars.palette.common.whiteChannel, 0.08) }),
          p: 3,
          gap: 3,
          display: 'flex',
          borderRadius: 2,
          color: 'common.white',
          flexDirection: 'column',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Iconify icon="mingcute:quote-left-fill" width={40} sx={{ opacity: 0.48 }} />

      <Typography variant="body2">{testimonial.content}</Typography>

      <Rating value={testimonial.ratingNumber} readOnly size="small" />

      <Box sx={{ gap: 2, display: 'flex' }}>
        <Avatar alt={testimonial.name} src={testimonial.avatarUrl} />

        <ListItemText
          primary={testimonial.name}
          secondary={testimonial.postedDate ? fDate(testimonial.postedDate) : testimonial.productName}
          slotProps={{
            secondary: {
              sx: {
                mt: 0.5,
                opacity: 0.64,
                color: 'inherit',
                typography: 'caption',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
}
