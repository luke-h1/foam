import { memo } from 'react';
import { ViewStyle } from 'react-native';

import {
  BrandIconName,
  BrandIcons,
  IconSize,
  resolveBrandIconSize,
} from './util/brand-icon-registry';

interface IconProps {
  name: BrandIconName;
  size?: IconSize;
  color?: string;
  style?: ViewStyle;
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
