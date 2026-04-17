'use client';

import { useId } from 'react';
import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export function Logo({ sx, disabled, className, href = '/', isSingle = true, ...other }) {
  const uniqueId = useId();

  const SILVER = '#e8e8e8';
  const PURPLE = '#9b30ff';

  /*
    * OR using local (public folder)
    *
    const singleLogo = (
      <img
        alt="Single logo"
        src={`${CONFIG.assetsDir}/logo/logo-single.svg`}
        width="100%"
        height="100%"
      />
    );

    const fullLogo = (
      <img
        alt="Full logo"
        src={`${CONFIG.assetsDir}/logo/logo-full.svg`}
        width="100%"
        height="100%"
      />
    );
    *
    */

  const singleLogo = (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`${uniqueId}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="80" height="80" fill="#050507" rx="3" />
      <text
        x="40"
        y="53"
        textAnchor="middle"
        fontFamily="Orbitron, sans-serif"
        fontWeight="900"
        fontSize="36"
        letterSpacing="-1"
        filter={`url(#${uniqueId}-glow)`}
      >
        <tspan fill={SILVER}>E</tspan>
        <tspan fill={PURPLE}>4</tspan>
      </text>
    </svg>
  );

  const fullLogo = (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 260 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`${uniqueId}-glow`} x="-10%" y="-60%" width="120%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Main brand name */}
      <text
        x="2"
        y="30"
        fontFamily="Orbitron, sans-serif"
        fontWeight="900"
        fontSize="22"
        letterSpacing="2"
        filter={`url(#${uniqueId}-glow)`}
      >
        <tspan fill={SILVER}>ENCH</tspan>
        <tspan fill={PURPLE}>4</tspan>
        <tspan fill={SILVER}>NT STUDIO</tspan>
      </text>
      {/* Sub tagline */}
      <text
        x="3"
        y="52"
        fontFamily="Rajdhani, sans-serif"
        fontSize="13"
        letterSpacing="3"
        fill="#e8e8e8"
      >
        Өөрийнхөө брендээ бүтээ
      </text>
    </svg>
  );

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="Logo"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 40,
          height: 40,
          ...(!isSingle && { width: 220, height: 62 }),
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {isSingle ? singleLogo : fullLogo}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
