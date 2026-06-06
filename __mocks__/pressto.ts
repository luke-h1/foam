import { ComponentType, createElement, type Ref } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Pressable as RNPressable, PressableProps } from 'react-native';

export const BasePressable = RNPressable as ComponentType<PressableProps>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PressableScale = (props: any & { ref?: Ref<never> }) => {
  const { ref, ...rest } = props;
  return createElement(RNPressable, { ref, ...rest });
};
PressableScale.displayName = 'PressableScale';

export type CustomPressableProps = PressableProps;

export const PressablesConfig = {};

export default {
  BasePressable: RNPressable,
  PressableScale,
  PressablesConfig,
};
