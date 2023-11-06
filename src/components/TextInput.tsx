import {
  BackgroundColorProps,
  BorderProps,
  ColorProps,
  LayoutProps,
  SpacingProps,
  TypographyProps,
  backgroundColor,
  border,
  color,
  composeRestyleFunctions,
  createRestyleComponent,
  layout,
  spacing,
  typography,
  useRestyle,
} from '@shopify/restyle';
import React, { forwardRef, useMemo } from 'react';
import {
  TextInputProps as RNTextInputProps,
  TextInput as RNTextInput,
} from 'react-native';
import { Theme } from '../styles/theme';

type RestyleProps = SpacingProps<Theme> &
  LayoutProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  ColorProps<Theme> &
  TypographyProps<Theme>;

export type TextInputProps = SpacingProps<Theme> &
  LayoutProps<Theme> &
  TypographyProps<Theme> &
  BorderProps<Theme> &
  ColorProps<Theme> &
  BackgroundColorProps<Theme> &
  RNTextInputProps;

const TextInput = forwardRef<unknown, TextInputProps>((props, ref) => {
  const restyleFunctions = composeRestyleFunctions<Theme, TextInputProps>([
    spacing,
    layout,
    border,
    color,
    backgroundColor,
    typography,
  ]);

  const rootProps = useRestyle(restyleFunctions, props);

  const Component = useMemo(() => {
    return createRestyleComponent<RestyleProps, Theme>(
      [spacing, layout, border, backgroundColor, color, typography],
      RNTextInput,
    );
  }, []);

  return (
    <Component
      paddingHorizontal="m"
      paddingVertical="xs"
      borderRadius="s"
      {...rootProps}
      {...{ ref }}
    />
  );
});

TextInput.displayName = 'TextInput';

export default TextInput;
