/* eslint-disable no-restricted-imports */
import { createHitslop } from '@app/utils';
import { forwardRef } from 'react';
import { Pressable, PressableProps, View } from 'react-native';

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
