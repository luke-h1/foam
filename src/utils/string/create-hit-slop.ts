import { Insets } from 'react-native';

export function createHitslop(size: number): Insets {
  return {
    top: size,
    left: size,
    bottom: size,
    right: size,
  };
}
