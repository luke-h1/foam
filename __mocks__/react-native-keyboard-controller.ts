import React from 'react';
import { View } from 'react-native';

export const KeyboardAvoidingView = ({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: unknown;
}) => React.createElement(View, props, children);

export const useReanimatedKeyboardAnimation = jest.fn(() => ({
  height: { value: 0 },
  progress: { value: 0 },
}));

export const useKeyboardHandler = jest.fn();

export const useKeyboardAnimation = jest.fn(() => ({
  height: 0,
  progress: 0,
}));
