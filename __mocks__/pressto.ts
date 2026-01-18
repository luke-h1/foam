import { ComponentType, forwardRef, createElement } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Pressable as RNPressable, PressableProps } from 'react-native';

export const BasePressable = RNPressable as ComponentType<PressableProps>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PressableScale = forwardRef<never, any>((props, ref) => {
  return createElement(RNPressable, { ref, ...props });
});
PressableScale.displayName = 'PressableScale';

export type CustomPressableProps = PressableProps;

export const PressablesConfig = {};

export default {
  BasePressable: RNPressable,
  PressableScale,
  PressablesConfig,
};
