import React from 'react';
// eslint-disable-next-line no-restricted-imports
import { type StyleProp, View, type ViewStyle } from 'react-native';

export const EaseView = ({
  children,
  style,
  ...rest
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) => React.createElement(View, { ...rest, style }, children);
