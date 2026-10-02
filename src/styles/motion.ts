import { Easing } from 'react-native-reanimated';

/**
 * How to use these values:
 *
 * - Press feedback lands on press-in and uses `instant`.
 * - Entrances use `easing.out` and stay at or under `slow`. Exits use `fast`,
 *   so they finish before an entrance would.
 * - Anything a finger moved settles with a spring, never a timing curve.
 *
 * Reanimated animations follow the system Reduce Motion setting by default.
 * Looping or decorative motion must also check `useReducedMotion()` and stop.
 */
export const motion = {
  instant: 110,
  fast: 160,
  medium: 220,
  slow: 300,

  easing: {
    /**
     * A strong ease-out. The built-in cubic curve starts too slowly, so
     * entrances look delayed.
     */
    out: Easing.bezier(0.23, 1, 0.32, 1),
    in: Easing.in(Easing.cubic),
    standard: Easing.inOut(Easing.cubic),
  },

  spring: {
    responsive: { damping: 28, stiffness: 320, mass: 0.8 },
    gentle: { damping: 22, stiffness: 240, mass: 0.55 },
  },

  pressMinScale: 0.97,
} as const;
