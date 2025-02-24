import { forwardRef } from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

export type ButtonProps = TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(
  ({ children, onPress, ...touchableProps }, ref) => (
    <TouchableOpacity
      ref={ref}
      {...touchableProps}
      style={[touchableProps.style]}
      onPress={onPress}
    >
      <View>{children}</View>
    </TouchableOpacity>
  ),
);

Button.displayName = 'Button';
