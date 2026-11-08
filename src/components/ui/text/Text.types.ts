import type { ReactNode, Ref } from 'react';
import type { TextInstance, TextProps as RNTextProps } from 'react-native';

import type { MarginProps } from '@app/styles/spacing';
import type { ThemeColor, ThemeColorToken } from '@app/styles/themes';

export type TextType =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subhead'
  | 'footnote'
  | 'caption'
  | 'caption2';

export type TextWeight =
  | 'ultralight'
  | 'thin'
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black';

export type TextVariant = 'default' | 'mono';

export type TextFamily = 'brand' | 'system';

export interface TextProps extends RNTextProps, MarginProps {
  ref?: Ref<TextInstance>;
  children?: ReactNode;
  type?: TextType;
  weight?: TextWeight;
  variant?: TextVariant;
  family?: TextFamily;
  color?: ThemeColor | ThemeColorToken;
  contrast?: boolean;
  highContrast?: boolean;
  italic?: boolean;
  tabular?: boolean;
  align?: 'left' | 'center' | 'right';
}
