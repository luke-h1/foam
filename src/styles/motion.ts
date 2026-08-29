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

  spring: {
    responsive: { damping: 28, stiffness: 320, mass: 0.8 },
    gentle: { damping: 22, stiffness: 240, mass: 0.55 },
  },

  pressMinScale: 0.97,
} as const;
