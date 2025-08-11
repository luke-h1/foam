/* eslint-disable no-restricted-imports */
import { createHitslop } from '@app/utils';
import { forwardRef } from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

export type ButtonProps = TouchableOpacityProps & {
  label?: string;
};

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      children,
      onPress,
      style,
      hitSlop = createHitslop(10),
      label,
      ...touchableProps
    },
    ref,
  ) => (
    <TouchableOpacity
      ref={ref}
      accessibilityLabel={label}
      {...touchableProps}
      hitSlop={hitSlop}
      style={style}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  ),
);

Button.displayName = 'Button';
