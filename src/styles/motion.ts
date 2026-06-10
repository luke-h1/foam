import { Easing } from 'react-native-reanimated';

/**
 * Shared motion tokens. Every animation in the app should pick a duration
 * and easing from here so transitions feel like one product rather than
 * per-file magic numbers.
 */
export const motion = {
  /** Press feedback, reveals tied directly to a touch. */
  instant: 110,
  /** Most state changes: toggles, fades, selection. */
  fast: 150,
  /** Layout-level changes: panel resizes, list layout switches. */
  medium: 200,
  /** Screen-scale moves; rarely needed because navigation is native. */
  slow: 300,

  easing: {
    /** Default for things entering or changing on screen. */
    out: Easing.out(Easing.cubic),
    /** For things leaving the screen. */
    in: Easing.in(Easing.cubic),
    standard: Easing.inOut(Easing.cubic),
  },

  /** Scale applied by pressto pressables; one press language app-wide. */
  pressMinScale: 0.97,
} as const;
