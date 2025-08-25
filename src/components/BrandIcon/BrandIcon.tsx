/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
import { typedObjectKeys } from '@app/utils';
// eslint-disable-next-line no-restricted-imports
import { ImageProps } from 'expo-image';
import { memo } from 'react';
import { DimensionValue } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Image } from '../Image';

export type BrandIconName = keyof typeof BrandIcons;

const ICON_SIZES = {
  xs: { height: 12, width: 12 },
  sm: { height: 16, width: 16 },
  md: { height: 20, width: 20 },
  lg: { height: 24, width: 24 },
} as const;

export type IconSize =
  | keyof typeof ICON_SIZES
  | { height: DimensionValue; width: DimensionValue };

export const IconSizes = typedObjectKeys(ICON_SIZES);

interface IconProps extends Omit<ImageProps, 'source'> {
  name: BrandIconName;
  size?: IconSize;
  color?: unknown;
}

export const BrandIcons = {
  /**
   * Companies
   */
  stv: require('../../../assets/icons/stv.svg'),
  twitch: require('../../../assets/icons/twitch.svg'),
  bttv: require('../../../assets/icons/bttv.svg'),
  ffz: require('../../../assets/icons/ffz.svg'),
} as const;

function resolveSize(size: IconSize) {
  if (typeof size === 'string') {
    return ICON_SIZES[size];
  }

  return {
    height: size.height,
    width: size.width,
  };
}

export const BrandIcon = memo(
  ({ name, color, size = 'md', style, ...props }: IconProps) => {
    const { height, width } = resolveSize(size);

    return (
      <Image
        contentFit="contain"
        priority="high"
        style={[styles.iconImage({ height, width, color }), style]}
        {...props}
        source={BrandIcons[name]}
        transition={0}
      />
    );
  },
);
BrandIcon.displayName = 'BrandIcon';

const styles = StyleSheet.create(() => ({
  iconImage: ({
    height,
    width,
  }: {
    height: DimensionValue;
    width: DimensionValue;
    color?: unknown;
  }) => ({
    height,
    width,
    // tintColor: color ? theme.colors[color] : undefined,
  }),
}));
