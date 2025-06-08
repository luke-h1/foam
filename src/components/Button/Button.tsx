import { createHitslop } from '@app/utils';
import { forwardRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

export type ButtonProps = TouchableOpacityProps & {};

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      children,
      onPress,
      style,
      hitSlop = createHitslop(10),
      ...touchableProps
    },
    ref,
  ) => (
    <TouchableOpacity
      ref={ref}
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
