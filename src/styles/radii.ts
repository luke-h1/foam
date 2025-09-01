export const radii = {
  sm: 4,
  md: 6,
  lg: 10,
  xl: 14,
  xxl: 18,
  full: 999,
} as const;

export type Radii = keyof typeof radii;
