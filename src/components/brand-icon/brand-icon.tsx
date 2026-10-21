import { memo } from 'react';
import type { ViewStyle } from 'react-native';

import {
  type BrandIconName,
  BrandIcons,
  type IconSize,
  resolveBrandIconSize,
} from './util/brand-icon-registry';

interface IconProps {
  name: BrandIconName;
  size?: IconSize | undefined;
  color?: string | undefined;
  style?: ViewStyle | undefined;
}

export const BrandIcon = memo(
  ({ name, color, size = 'md', style, ...props }: IconProps) => {
    const { height, width } = resolveBrandIconSize(size);
    const IconComponent = BrandIcons[name];

    return (
      <IconComponent
        color={color}
        style={[{ height, width }, style]}
        {...props}
      />
    );
  },
);
