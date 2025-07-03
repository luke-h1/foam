/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
import { ThemeColor } from '@app/styles';
import { typedObjectKeys } from '@app/utils';
// eslint-disable-next-line no-restricted-imports
import { ImageProps } from 'expo-image';
import { memo } from 'react';
import { DimensionValue } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
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
  color?: ThemeColor;
}

const BrandIcons = {
  stv: require('../../../assets/icons/stv.svg'),
  twitch: require('../../../assets/icons/twitch.svg'),
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
    const { styles } = useStyles(stylesheet);
    const { height, width } = resolveSize(size);

    return (
      <Image
        contentFit="contain"
        style={[styles.iconImage({ height, width, color }), style]}
        {...props}
        source={BrandIcons[name]}
        transition={0}
      />
    );
  },
);
BrandIcon.displayName = 'BrandIcon';

const stylesheet = createStyleSheet(theme => ({
  iconImage: ({
    height,
    width,
    color,
  }: {
    height: DimensionValue;
    width: DimensionValue;
    color?: ThemeColor;
  }) => ({
    height,
    width,
    tintColor: color ? theme.colors[color] : undefined,
  }),
}));
