import { Easing } from 'react-native-reanimated';

export const motion = {
  instant: 110,
  fast: 150,
  medium: 200,
  slow: 300,

  easing: {
    out: Easing.out(Easing.cubic),
    in: Easing.in(Easing.cubic),
    standard: Easing.inOut(Easing.cubic),
  },

  /**
   * withSpring configs: `responsive` for gesture and layout-driven motion, `gentle` for ambient reveals.
   */
  spring: {
    responsive: { damping: 28, stiffness: 320, mass: 0.8 },
    gentle: { damping: 22, stiffness: 240, mass: 0.55 },
  },

  pressMinScale: 0.97,
} as const;
