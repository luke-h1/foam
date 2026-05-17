import { Insets } from 'react-native';

export function createHitslop(size: number): Insets {
  return {
    top: size,
    left: size,
    bottom: size,
    right: size,
  };
}

export function createHorizontalHitslop(size: number): Insets {
  return {
    top: 0,
    left: size,
    bottom: 0,
    right: size,
  };
}
