import React from 'react';
// eslint-disable-next-line no-restricted-imports
import { View } from 'react-native';

const passthroughComponent = ({
  children,
  ...props
}: {
  children?: React.ReactNode;
}) => React.createElement(View, props, children);

type MockChainableGesture = Record<string, () => MockChainableGesture>;

const createGesture = () => {
  const gesture: MockChainableGesture = {};
  const chainable = () => gesture;
  [
    'activeOffsetX',
    'activeOffsetY',
    'direction',
    'enabled',
    'failOffsetX',
    'failOffsetY',
    'maxDuration',
    'maxPointers',
    'minPointers',
    'numberOfTaps',
    'onBegin',
    'onEnd',
    'onFinalize',
    'onStart',
    'onTouchesDown',
    'onTouchesUp',
    'onUpdate',
    'requireExternalGestureToFail',
    'runOnJS',
    'simultaneousWithExternalGesture',
  ].forEach(method => {
    gesture[method] = chainable;
  });
  return gesture;
};

export const Directions = {
  DOWN: 4,
  LEFT: 2,
  RIGHT: 1,
  UP: 8,
};

export const Gesture = {
  Exclusive: (...gestures: unknown[]) => gestures,
  Fling: createGesture,
  Pan: createGesture,
  Pinch: createGesture,
  Race: (...gestures: unknown[]) => gestures,
  Simultaneous: (...gestures: unknown[]) => gestures,
  Tap: createGesture,
};

export const GestureDetector = passthroughComponent;
export const GestureHandlerRootView = passthroughComponent;
export const Pressable = passthroughComponent;
export const RectButton = passthroughComponent;
export const ScrollView = passthroughComponent;
