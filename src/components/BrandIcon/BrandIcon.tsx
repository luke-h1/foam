import { typedObjectKeys } from '@app/utils/typescript/typedObjectKeys';
import { memo } from 'react';
import { DimensionValue, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { BttvIcon, FfzIcon, StvIcon, TwitchIcon } from './svg';

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

interface IconProps {
  name: BrandIconName;
  size?: IconSize;
  color?: string;
  style?: ViewStyle;
}

export const BrandIcons = {
  /**
   * Companies
   */
  stv: StvIcon,
  twitch: TwitchIcon,
  bttv: BttvIcon,
  ffz: FfzIcon,
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
    const IconComponent = BrandIcons[name];

    return (
      <IconComponent
        color={color}
        style={[styles.iconImage({ height, width }), style]}
        {...props}
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
  }) => ({
    height,
    width,
  }),
}));
