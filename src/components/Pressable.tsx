import {
  BackgroundColorProps,
  BorderProps,
  LayoutProps,
  SpacingProps,
  backgroundColor,
  border,
  createRestyleComponent,
  layout,
  spacing,
} from '@shopify/restyle';
import { PressableProps as RNPressableProps, Pressable as RNPressable } from 'react-native';
import { Theme } from '../styles/theme';

export type PressableProps = SpacingProps<Theme> &
  LayoutProps<Theme> &
  BackgroundColorProps<Theme> &
  BorderProps<Theme> &
  Omit<RNPressableProps, 'height' | 'width' | 'borderRadius'>;


const Pressabble = createRestyleComponent<PressableProps, Theme>(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  [spacing, backgroundColor, border, layout],
  RNPressable,
);
export default Pressabble;
