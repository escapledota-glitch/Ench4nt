import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { ParticlesBg } from 'src/components/particles-bg';

// ----------------------------------------------------------------------

const NAV_LINKS = [
  { name: 'ДЭЛГҮҮР', href: paths.product.root },
  { name: 'БИДНИЙ ТУХАЙ', href: paths.about },
  { name: 'ХОЛБОО БАРИХ', href: paths.contact },
  { name: 'ТҮГЭЭМЭЛ АСУУЛТ', href: paths.faqs },
];

// ----------------------------------------------------------------------

const FooterRoot = styled('footer')(() => ({
  position: 'relative',
  backgroundImage: 'url(https://res.cloudinary.com/dr09loi2q/image/upload/q_auto,f_auto/ench4nt/stars-bg.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center bottom',
  borderTop: '1px solid rgba(155,48,255,0.2)',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  '& > *': { position: 'relative', zIndex: 1 },
}));

const MetalText = styled(Typography)(() => ({
  background: 'linear-gradient(180deg, #ffffff 0%, #c8c8c8 40%, #888888 70%, #b0b0b0 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: 900,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
}));

const SocialBtn = styled(IconButton)(() => ({
  width: 40,
  height: 40,
  border: '1px solid rgba(192,192,192,0.3)',
  borderRadius: 0,
  color: '#a0a0a0',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #2a2a2a, #3a3a3a)',
    borderColor: '#c8c8c8',
    color: '#ffffff',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(200,200,200,0.15)',
  },
}));

const NavLink = styled(Link)(() => ({
  color: '#888888',
  textDecoration: 'none',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  transition: 'color 0.2s ease',
  '&:hover': {
    color: '#e0e0e0',
  },
}));

// ----------------------------------------------------------------------

export function Footer({ sx, ...other }) {
  return (
    <FooterRoot sx={sx} {...other}>
      <ParticlesBg count={70} style={{ zIndex: 0 }} />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Top strip */}
        <Box
          sx={{
            py: 4,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 3,
          }}
        >
          {/* Brand name */}
          <MetalText variant="h4" sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' } }}>
            ENCH4NT STUDIO
          </MetalText>

          {/* Nav links */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, md: 4 }, alignItems: 'center' }}>
            {NAV_LINKS.map((link) => (
              <NavLink key={link.name} component={RouterLink} href={link.href}>
                {link.name}
              </NavLink>
            ))}
          </Box>

          {/* Socials */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <SocialBtn
              component="a"
              href="https://www.instagram.com/ench4ntstudiomongolia/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Iconify icon="socials:instagram" width={18} />
            </SocialBtn>
            <SocialBtn
              component="a"
              href="https://www.facebook.com/EnayToMoon/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <Iconify icon="socials:facebook" width={18} />
            </SocialBtn>
          </Box>
        </Box>

        {/* Divider */}
        <Box
          sx={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(192,192,192,0.2), transparent)',
          }}
        />

        {/* Bottom strip */}
        <Box
          sx={{
            py: 2.5,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            © {new Date().getFullYear()} ENCH4NT STUDIO — ALL RIGHTS RESERVED
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <NavLink href="#" sx={{ fontSize: '0.65rem' }}>
              НУУЦЛАЛЫН БОДЛОГО
            </NavLink>
            <NavLink href="#" sx={{ fontSize: '0.65rem' }}>
              ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ
            </NavLink>
            <NavLink component={RouterLink} href="/dashboard" sx={{ fontSize: '0.55rem', color: '#333', '&:hover': { color: '#666' } }}>
              dashboard
            </NavLink>
          </Box>
        </Box>
      </Container>
    </FooterRoot>
  );
}

// ----------------------------------------------------------------------

export function HomeFooter({ sx, ...other }) {
  return (
    <FooterRoot
      sx={[{ py: 4, textAlign: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <Container>
        <MetalText variant="h5" sx={{ fontSize: '1.4rem', mb: 2 }}>
          ENCH4NT STUDIO
        </MetalText>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
          <SocialBtn
            component="a"
            href="https://www.instagram.com/ench4ntstudiomongolia/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <Iconify icon="socials:instagram" width={18} />
          </SocialBtn>
          <SocialBtn
            component="a"
            href="https://www.facebook.com/EnayToMoon/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <Iconify icon="socials:facebook" width={18} />
          </SocialBtn>
        </Box>

        <Typography variant="caption" sx={{ color: '#555', letterSpacing: '0.08em' }}>
          © {new Date().getFullYear()} ENCH4NT STUDIO — ALL RIGHTS RESERVED
        </Typography>
      </Container>
    </FooterRoot>
  );
}
