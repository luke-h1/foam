import React from 'react';
// eslint-disable-next-line no-restricted-imports
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
