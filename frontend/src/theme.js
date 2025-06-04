// src/theme.js
import { extendTheme } from '@mui/joy/styles';
import joyColors from '@mui/joy/colors';

const monochromeDarkTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        // ...
      },
    },
    dark: {
      palette: {
        primary: {
          50: joyColors.grey[50],
          100: joyColors.grey[100],
          200: joyColors.grey[200],
          300: joyColors.grey[300],
          400: joyColors.grey[400],
          500: joyColors.grey[500],
          600: joyColors.grey[600],
          700: joyColors.grey[700],
          800: joyColors.grey[800],
          900: joyColors.grey[900],
          solidBg: 'var(--joy-palette-primary-700)',
          solidHoverBg: 'var(--joy-palette-primary-600)',
          solidActiveBg: 'var(--joy-palette-primary-500)',
          solidColor: 'var(--joy-palette-primary-200)',

          outlinedBorder: 'var(--joy-palette-primary-500)',
          outlinedColor: 'var(--joy-palette-primary-200)',
          outlinedHoverBg: 'var(--joy-palette-neutral-800)',
          outlinedActiveBg: 'var(--joy-palette-neutral-700)',

          plainColor: 'var(--joy-palette-primary-300)',
          plainHoverBg: 'var(--joy-palette-neutral-800)',
          plainActiveBg: 'var(--joy-palette-neutral-700)',

          softColor: 'var(--joy-palette-primary-200)',
          softBg: 'var(--joy-palette-primary-800)',
          softHoverBg: 'var(--joy-palette-primary-700)',
          softActiveBg: 'var(--joy-palette-primary-600)',
        },
        neutral: {
          ...joyColors.grey, 
          plainColor: 'var(--joy-palette-neutral-200)',
          plainHoverBg: 'var(--joy-palette-neutral-800)',
          plainActiveBg: 'var(--joy-palette-neutral-700)',
        },
        background: {
          body: 'var(--joy-palette-neutral-900)',
          surface: 'var(--joy-palette-neutral-800)',
          level1: 'var(--joy-palette-neutral-800)',
          level2: 'var(--joy-palette-neutral-700)',
          level3: 'var(--joy-palette-neutral-600)',
          tooltip: 'var(--joy-palette-neutral-600)',
        },
        text: {
          primary: 'var(--joy-palette-neutral-100)',
          secondary: 'var(--joy-palette-neutral-300)',
          tertiary: 'var(--joy-palette-neutral-400)',
          icon: 'var(--joy-palette-neutral-300)',
        },
        divider: 'var(--joy-palette-neutral-700)',
        focusVisible: 'var(--joy-palette-primary-500)',
      },
    },
  },
});

export default monochromeDarkTheme;