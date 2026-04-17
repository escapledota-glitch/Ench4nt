import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Fab from '@mui/material/Fab';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

export function AboutVision({ sx, ...other }) {
  const renderImage = () => (
    <Image
      src={`${CONFIG.assetsDir}/assets/images/about/vision.webp`}
      alt="About vision"
      ratio={{ xs: '4/3', sm: '16/9' }}
      slotProps={{
        overlay: {
          sx: (theme) => ({
            bgcolor: varAlpha(theme.vars.palette.grey['900Channel'], 0.48),
          }),
        },
      }}
    />
  );

  const renderLogos = () => (
    <Box
      sx={{
        width: 1,
        zIndex: 9,
        bottom: 0,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        position: 'absolute',
        justifyContent: 'center',
        py: { xs: 2, md: 3 },
        gap: { xs: 2, md: 4 },
      }}
    >
      {BRAND_FEATURES.map((feat) => (
        <m.div key={feat} variants={varFade('in')}>
          <Box
            sx={{
              px: 2,
              py: 0.75,
              borderRadius: 1,
              bgcolor: 'rgba(155,48,255,0.18)',
              border: '1px solid rgba(155,48,255,0.4)',
              color: '#fff',
              fontSize: { xs: '0.7rem', md: '0.8rem' },
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {feat}
          </Box>
        </m.div>
      ))}
    </Box>
  );

  return (
    <Box
      component="section"
      sx={[
        {
          pb: 10,
          position: 'relative',
          bgcolor: 'background.neutral',
          '&::before': {
            top: 0,
            left: 0,
            width: 1,
            content: "''",
            position: 'absolute',
            height: { xs: 80, md: 120 },
            bgcolor: 'background.default',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Container component={MotionViewport}>
        <Box
          sx={{
            mb: 10,
            borderRadius: 2,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderImage()}
          {renderLogos()}

          <Fab sx={{ position: 'absolute', zIndex: 9 }}>
            <Iconify icon="solar:play-broken" width={24} />
          </Fab>
        </Box>

        <Typography
          component={m.h6}
          variants={varFade('inUp')}
          variant="h3"
          sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}
        >
          Бид хэрэглэгч бүрт хамгийн сайн чанар, хамгийн зөв шийдлийг хүргэхийг зорьдог.
          Таны сэтгэл ханамж бол бидний хамгийн том амжилт юм.
        </Typography>
      </Container>
    </Box>
  );
}

const BRAND_FEATURES = [
  'Хэрэхэд хялбар захиалга',
  'Өндөр чанарын материал',
  'Түргэн шуурхай үйлчилгээ',
  'Хэрэглэгч төвтэй хандлага',
  'Custom дизайн',
  'Боломжийн үнэ',
];
