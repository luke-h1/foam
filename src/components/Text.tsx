import {
  backgroundColor,
  color,
  createRestyleComponent,
  createVariant,
  layout,
  spacing,
  textRestyleFunctions,
  ColorProps,
  LayoutProps,
  SpacingProps,
  VariantProps,
  TextProps as RestyleTextProps,
  BackgroundColorProps,
} from '@shopify/restyle';
import { TextProps as RNTextProps, Text as RNText } from 'react-native';
import { Theme } from '../styles/theme';

type TextProps = VariantProps<Theme, 'textVariants'> &
  SpacingProps<Theme> &
  LayoutProps<Theme> &
  ColorProps<Theme> &
  BackgroundColorProps<Theme> &
  RestyleTextProps<Theme> &
  RNTextProps;

const textVariants = createVariant({
  themeKey: 'textVariants',
});

const Text = createRestyleComponent<TextProps, Theme>(
  [
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    textVariants,
    spacing,
    layout,
    color,
    backgroundColor,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ...textRestyleFunctions,
  ],
  RNText,
);
export default Text;
