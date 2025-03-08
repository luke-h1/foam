import { forwardRef } from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

export type ButtonProps = TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(
  ({ children, onPress, style, ...touchableProps }, ref) => (
    <TouchableOpacity
      ref={ref}
      {...touchableProps}
      style={style}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  ),
);

Button.displayName = 'Button';
