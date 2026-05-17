import type { MotionTabPalette } from '../types';

function palette<T extends 'dark' | 'light'>(scheme: T): MotionTabPalette {
  if (scheme === 'dark') {
    return {
      accent: 'rgba(255,255,255,0.10)',
      border: 'rgba(255,255,255,0.06)',
      foreground: '#f5f5f7',
      muted: '#8e8e93',
      surface: 'rgba(24,24,27,0.92)',
    };
  }

  return {
    accent: 'rgba(0,0,0,0.06)',
    border: 'rgba(0,0,0,0.06)',
    foreground: '#0a0a0a',
    muted: '#71717a',
    surface: 'rgba(245,245,247,0.94)',
  };
}

export { palette };
