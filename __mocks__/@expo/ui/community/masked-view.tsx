import React from 'react';
import { View, type ViewProps } from 'react-native';

export const MaskedView = ({
  maskElement,
  children,
  ...props
}: ViewProps & { maskElement?: React.ReactNode; children?: React.ReactNode }) =>
  React.createElement(
    View,
    { testID: 'masked-view', ...props },
    maskElement,
    children,
  );
