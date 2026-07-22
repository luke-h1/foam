/**
 * Shared shimmer sweep gradient for the native and web Skeleton variants -
 * keep both platforms visually in sync. The white sweep vanishes on the light
 * scheme's near-white surface, so light uses a dark sweep instead.
 */
export const SHIMMER_GRADIENT_COLORS = {
  dark: [
    'rgba(255,255,255,0)',
    'rgba(255,255,255,0.18)',
    'rgba(255,255,255,0)',
  ],
  light: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0)'],
} as const;
