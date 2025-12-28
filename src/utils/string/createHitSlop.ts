import { Insets } from 'react-native';

export const createHitslop = (size: number): Insets => ({
  top: size,
  left: size,
  bottom: size,
  right: size,
});

/**
 * Creates horizontal-only hit slop (left and right only)
 * Useful for buttons in rows where vertical spacing is tight
 */
export const createHorizontalHitslop = (size: number): Insets => ({
  top: 0,
  left: size,
  bottom: 0,
  right: size,
});
