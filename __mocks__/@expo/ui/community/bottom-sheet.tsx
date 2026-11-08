import React from 'react';
import { View } from 'react-native';

export const BottomSheet = ({
  children,
  index,
}: {
  children?: React.ReactNode;
  index?: number;
}) => (index === -1 ? null : React.createElement(View, null, children));
