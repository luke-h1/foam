import { memo } from 'react';
import { DimensionValue, ViewStyle } from 'react-native';

import {
  BrandIconName,
  BrandIcons,
  IconSize,
  resolveBrandIconSize,
} from './brandIconRegistry';

interface IconProps {
  name: BrandIconName;
  size?: IconSize;
  color?: string;
  style?: ViewStyle;
}

function getIconImageStyle({
  height,
  width,
}: {
  height: DimensionValue;
  width: DimensionValue;
}) {
  return {
    height,
    width,
  };
}

export const BrandIcon = memo(
  ({ name, color, size = 'md', style, ...props }: IconProps) => {
    const { height, width } = resolveBrandIconSize(size);
    const IconComponent = BrandIcons[name];

    return (
      <IconComponent
        color={color}
        style={[getIconImageStyle({ height, width }), style]}
        {...props}
      />
    );
  },
);
