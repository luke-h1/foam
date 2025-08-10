import { createHitslop } from '@app/utils';
import { forwardRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import {
  Pressable,
  PressableProps,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

export type ButtonProps = PressableProps & {
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
    <Pressable
      ref={ref}
      accessibilityLabel={label}
      {...touchableProps}
      hitSlop={hitSlop}
      style={style}
      onPress={onPress}
    >
      {children}
    </Pressable>
  ),
);

Button.displayName = 'Button';
