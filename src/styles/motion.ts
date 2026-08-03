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

  pressMinScale: 0.97,
} as const;
