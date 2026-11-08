import { type ComponentType, createElement, type Ref } from 'react';
import { Pressable as RNPressable, type PressableProps } from 'react-native';

export const BasePressable: ComponentType<PressableProps> = RNPressable;

// oxlint-disable-next-line @typescript-eslint/no-explicit-any -- the mock forwards any Pressable prop set to react-native
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
