import { DimensionValue } from 'react-native';

import { BttvIcon } from './svg/BttvIcon';
import { StvIcon } from './svg/StvIcon';

const ICON_SIZES = {
  xs: { height: 12, width: 12 },
  sm: { height: 16, width: 16 },
  md: { height: 20, width: 20 },
  lg: { height: 24, width: 24 },
} as const;

export type IconSize =
  | keyof typeof ICON_SIZES
  | { height: DimensionValue; width: DimensionValue };

export const BrandIcons = {
  stv: StvIcon,
  bttv: BttvIcon,
} as const;

export type BrandIconName = keyof typeof BrandIcons;

export function resolveBrandIconSize(size: IconSize) {
  if (typeof size === 'string') {
    return ICON_SIZES[size];
  }

  return {
    height: size.height,
    width: size.width,
  };
}
