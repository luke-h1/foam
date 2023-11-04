import {
  backgroundColor,
  border,
  createRestyleComponent,
  layout,
  spacing,
} from '@shopify/restyle';
import { PressableProps, Pressable as RNPressable } from 'react-native';
import { Theme } from '../styles/theme';

const Pressabble = createRestyleComponent<PressableProps, Theme>(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  [spacing, backgroundColor, border, layout],
  RNPressable,
);
export default Pressabble;
