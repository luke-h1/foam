/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { type FontVariant, type TextStyle } from 'react-native';
import { UnistylesThemes } from 'react-native-unistyles';
import { ThemeColor } from './colors';
import { FontSize } from './font';
import { getMargin, MarginProps } from './spacing';

export type FontWeight = 'light' | 'regular' | 'medium' | 'bold';

export type TextStyleProps = {
  align?: 'left' | 'center' | 'right';
  color?: ThemeColor;
  contrast?: boolean;
  highContrast?: boolean;
  italic?: boolean;
  size: FontSize;
  tabular?: boolean;
  variant?: 'SFPro' | 'mono';
  weight?: FontWeight;
} & MarginProps;

export function getTextStyles(theme: UnistylesThemes['dark']) {
  return function styles(
    {
      align = 'left',
      color = 'gray',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      variant = 'SFPro',
      contrast = false,
      highContrast = color === 'gray',
      size = 'md',
      tabular,
      italic,
      weight = 'regular',
      ...props
    }: TextStyleProps,
    scaling: number,
  ) {
    const fontVariant: FontVariant[] = ['no-contextual', 'stylistic-four'];

    if (tabular) {
      fontVariant.push('tabular-nums');
    }

    return {
      ...getMargin(theme)(props),
      color:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        theme.colors[color][
          // eslint-disable-next-line no-nested-ternary
          contrast ? 'contrast' : highContrast ? 'text' : 'textLow'
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
        ] as keyof (typeof theme.colors)[typeof color],
      fontSize: theme.font.fontSize[size] * scaling,
      fontStyle: italic ? 'italic' : 'normal',
      fontVariant,
      fontWeight: weights[weight],
      // lineHeight: theme.font.fontSize[size].lineHeight * scaling,
      textAlign: align,
    };
  };
}

export const weights: Record<FontWeight, TextStyle['fontWeight']> = {
  bold: '700',
  light: '300',
  medium: '500',
  regular: '400',
};

export function addTextSize(size: FontSize, by: number): FontSize {
  const next = Number(size) + by;

  if (next < 1) {
    return 'sm';
  }

  if (next > 9) {
    return '2xl';
  }

  return String(next) as FontSize;
}
