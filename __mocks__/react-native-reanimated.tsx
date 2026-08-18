import React from 'react';
// eslint-disable-next-line no-restricted-imports
import { View } from 'react-native';

const animatedComponent = React.forwardRef(
  (
    { children, ...props }: { children?: React.ReactNode },
    ref: React.Ref<View>,
  ) => (
    <View {...props} ref={ref}>
      {children}
    </View>
  ),
);

const identityAnimation = <T,>(
  value: T,
  _config?: { duration?: number; easing?: (value: number) => number },
  callback?: (finished?: boolean) => void,
) => {
  callback?.(true);
  return value;
};

const mutable = <T,>(value: T) => {
  const sv = {
    value,
    get: () => sv.value,
    set: (v: T) => {
      sv.value = v;
    },
  };
  return sv;
};

export default {
  call: () => {},
  createAnimatedComponent: <T,>(component: T) => component,
  FlatList: animatedComponent,
  Image: animatedComponent,
  ScrollView: animatedComponent,
  Text: animatedComponent,
  View: animatedComponent,
};

export const cancelAnimation = jest.fn();

export const createAnimatedComponent = <T,>(component: T) => component;

export const Easing = {
  bezier: jest.fn(() => jest.fn()),
  cubic: jest.fn(),
  in: jest.fn(easing => easing),
  inOut: jest.fn(easing => easing),
  linear: jest.fn(),
  out: jest.fn(easing => easing),
};

export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

export const interpolate = jest.fn((value: number) => value);
export const interpolateColor = jest.fn((value: number) => value);
export const makeMutable = mutable;
export const runOnJS = <T,>(fn: T) => fn;
export const runOnUI = <T,>(fn: T) => fn;
export const useAnimatedReaction = jest.fn();
export const useAnimatedRef = () => ({ current: null });
export const useFrameCallback = jest.fn(() => ({ setActive: jest.fn() }));
export const useAnimatedStyle = <T,>(updater: () => T) => updater();
export const useDerivedValue = <T,>(updater: () => T) => mutable(updater());
export const useSharedValue = <T,>(value: T) => mutable(value);
export const withDelay = <T,>(_delay: number, value: T) => value;
export const withRepeat = <T,>(value: T) => value;
export const withSequence = (...values: unknown[]) => values.at(-1);
export const withSpring = identityAnimation;
export const withTiming = identityAnimation;

type MockChainableAnimationBuilder = Record<
  string,
  () => MockChainableAnimationBuilder
>;

const createAnimationBuilder = () => {
  const builder: MockChainableAnimationBuilder = {};
  for (const method of [
    'duration',
    'delay',
    'easing',
    'springify',
    'damping',
    'stiffness',
    'mass',
    'build',
  ]) {
    builder[method] = () => builder;
  }
  return builder;
};

export const FadeIn = createAnimationBuilder();
export const FadeInUp = createAnimationBuilder();
export const FadeInDown = createAnimationBuilder();
export const FadeOut = createAnimationBuilder();
export const FadeOutUp = createAnimationBuilder();
export const FadeOutDown = createAnimationBuilder();
export const SlideInDown = createAnimationBuilder();
