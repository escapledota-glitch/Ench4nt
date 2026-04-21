import { varAlpha, mergeClasses } from 'minimal-shared/utils';

import { styled } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';

import { Iconify } from 'src/components/iconify';
import { createNavItem, navItemStyles, navSectionClasses } from 'src/components/nav-section';

// ----------------------------------------------------------------------

export function NavItem({
  title,
  path,
  /********/
  open,
  active,
  /********/
  subItem,
  hasChild,
  className,
  externalLink,
  ...other
}) {
  const navItem = createNavItem({ path, hasChild, externalLink });

  const ownerState = { open, active, variant: !subItem ? 'rootItem' : 'subItem' };

  return (
    <ItemRoot
      disableRipple
      aria-label={title}
      {...ownerState}
      {...navItem.baseProps}
      className={mergeClasses([navSectionClasses.item.root, className], {
        [navSectionClasses.state.open]: open,
        [navSectionClasses.state.active]: active,
      })}
      {...other}
    >
      <ItemTitle {...ownerState}> {title}</ItemTitle>

      {hasChild && <ItemArrow {...ownerState} icon="eva:arrow-ios-downward-fill" />}
    </ItemRoot>
  );
}

// ----------------------------------------------------------------------

const shouldForwardProp = (prop) => !['open', 'active', 'variant', 'sx'].includes(prop);

/**
 * @slot root
 */
const ItemRoot = styled(ButtonBase, { shouldForwardProp })(({ active, open, theme }) => {
  const dotTransitions = {
    in: { opacity: 0, scale: 0 },
    out: { opacity: 1, scale: 1 },
  };

  const dotStyles = {
    ...dotTransitions.in,
    width: 6,
    height: 6,
    left: -12,
    content: '""',
    borderRadius: '50%',
    position: 'absolute',
    backgroundColor: varAlpha(theme.vars.palette.text.disabledChannel, 0.64),
    transition: theme.transitions.create(['opacity', 'scale'], {
      duration: theme.transitions.duration.shorter,
    }),
    ...(active && { ...dotTransitions.out, backgroundColor: theme.vars.palette.primary.main }),
  };

  const rootItemStyles = {
    color: '#c0c0c0',
    transition: 'color 0.2s, text-shadow 0.2s',
    '&:hover': {
      color: '#fff',
      textShadow: '0 0 8px #9b30ff, 0 0 20px rgba(155,48,255,0.6), 0 0 40px rgba(155,48,255,0.3)',
    },
    ...(open && { '&::before': { ...dotTransitions.out } }),
    ...(active && {
      color: '#c880ff',
      textShadow: '0 0 10px rgba(155,48,255,0.8), 0 0 24px rgba(155,48,255,0.4)',
    }),
  };

  const subItemStyles = {
    color: '#888',
    '&:hover': { color: '#e8e8e8' },
    ...(active && { color: '#9b30ff' }),
  };

  return {
    transition: theme.transitions.create(['color'], {
      duration: theme.transitions.duration.shorter,
    }),
    '&::before': dotStyles,
    '&:hover::before': { ...dotTransitions.out },
    variants: [
      { props: { variant: 'rootItem' }, style: rootItemStyles },
      { props: { variant: 'subItem' }, style: subItemStyles },
    ],
  };
});

/**
 * @slot title
 */
const ItemTitle = styled('span', { shouldForwardProp })(({ theme }) => ({
  ...navItemStyles.title(theme),
  ...theme.typography.body2,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  fontSize: theme.typography.pxToRem(12),
  fontFamily: '"Orbitron", sans-serif',
  variants: [
    { props: { variant: 'subItem' }, style: { fontSize: theme.typography.pxToRem(11), fontFamily: 'inherit', letterSpacing: '1px' } },
    { props: { active: true }, style: { fontWeight: 800 } },
  ],
}));

/**
 * @slot arrow
 */
const ItemArrow = styled(Iconify, { shouldForwardProp })(({ theme }) => ({
  ...navItemStyles.arrow(theme),
}));
