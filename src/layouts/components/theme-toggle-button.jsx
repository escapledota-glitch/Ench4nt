'use client';

import { useState } from 'react';
import { useColorScheme } from '@mui/material/styles';
import { keyframes, styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { useSettingsContext } from 'src/components/settings';

// ----------------------------------------------------------------------

const spinOut = keyframes`
  0%   { transform: rotate(0deg) scale(1); opacity: 1; }
  100% { transform: rotate(180deg) scale(0); opacity: 0; }
`;

const spinIn = keyframes`
  0%   { transform: rotate(-180deg) scale(0); opacity: 0; }
  100% { transform: rotate(0deg) scale(1); opacity: 1; }
`;

const sunRays = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,210,60,0); }
  50%       { box-shadow: 0 0 16px 6px rgba(255,210,60,0.45); }
`;

const moonGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(160,140,255,0); }
  50%       { box-shadow: 0 0 14px 5px rgba(160,140,255,0.4); }
`;

const Btn = styled(IconButton, { shouldForwardProp: (prop) => prop !== 'isDark' })(({ isDark }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  position: 'relative',
  overflow: 'visible',
  transition: 'background 0.3s',
  background: isDark ? 'rgba(160,140,255,0.08)' : 'rgba(255,210,60,0.08)',
  animation: isDark
    ? `${moonGlow} 3s ease-in-out infinite`
    : `${sunRays} 3s ease-in-out infinite`,
  '&:hover': {
    background: isDark ? 'rgba(160,140,255,0.18)' : 'rgba(255,210,60,0.2)',
  },
}));

const IconWrap = styled('span', { shouldForwardProp: (prop) => prop !== 'animating' })(({ animating }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  animation: animating ? `${spinOut} 0.25s ease forwards` : `${spinIn} 0.3s ease forwards`,
}));

// ----------------------------------------------------------------------

export function ThemeToggleButton() {
  const { mode, setMode, colorScheme } = useColorScheme();
  const settings = useSettingsContext();
  const [animating, setAnimating] = useState(false);

  const isDark = (colorScheme || mode) === 'dark';

  const handleToggle = () => {
    setAnimating(true);
    setTimeout(() => {
      const next = isDark ? 'light' : 'dark';
      setMode(next);
      settings.setState({ colorScheme: next });
      setAnimating(false);
    }, 250);
  };

  return (
    <Tooltip title={isDark ? 'Өдрийн горим' : 'Шөнийн горим'} placement="bottom">
      <Btn onClick={handleToggle} isDark={isDark ? 1 : 0}>
        <IconWrap animating={animating ? 1 : 0}>
          {isDark ? '🌙' : '☀️'}
        </IconWrap>
      </Btn>
    </Tooltip>
  );
}
