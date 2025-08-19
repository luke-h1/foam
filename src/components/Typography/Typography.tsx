/* eslint-disable @typescript-eslint/no-unsafe-assignment */
 
import { FontSize, FontWeight, ThemeColor } from '@app/styles';
import { getMargin, MarginProps } from '@app/styles/spacing';
import { forwardRef, LegacyRef, ReactNode } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Text, TextProps, type FontVariant } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

export type TypographyStyleProps = {
  align?: 'left' | 'center' | 'right';
  color?: ThemeColor;
  contrast?: boolean;
  highContrast?: boolean;
  italic?: boolean;
  size?: FontSize;
  tabular?: boolean;
  fontFamily?: 'SFPro' | 'mono';
  fontWeight?: FontWeight;
} & MarginProps;

export interface TypographyProps
  extends TextProps,
    Partial<TypographyStyleProps> {
  children: ReactNode;
  animated?: boolean;
}

export function addTextSize(size: FontSize, by: number): FontSize {
  const sizeOrder: FontSize[] = [
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
    '3xl',
    '4xl',
    '5xl',
  ];
  const currentIndex = sizeOrder.indexOf(size);
  const nextIndex = currentIndex + by;

  if (nextIndex < 0) {
    return 'xs';
  }

  if (nextIndex >= sizeOrder.length) {
    return '5xl';
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return sizeOrder[nextIndex]!;
}

export const Typography = forwardRef<Text, TypographyProps>(
  (
    {
      size = 'md',
      color = 'gray',
      align = 'left',
      contrast = color === 'gray',
      highContrast,
      italic,
      tabular,
      children,
      style,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      animated,
      // Margin props
      m,
      mb,
      ml,
      mr,
      mt,
      mx,
      my,
      ...props
    }: TypographyProps,
    ref: LegacyRef<Text>,
  ) => {
    const { theme } = useUnistyles();

    // Determine contrast level logic once
    const resolvedHighContrast = highContrast ?? color === 'gray';
    // eslint-disable-next-line no-nested-ternary
    const contrastLevel = contrast
      ? 'contrast'
      : resolvedHighContrast
        ? 'text'
        : 'textLow';

    // Build font variant array
    const fontVariant: FontVariant[] = ['no-contextual', 'stylistic-four'];
    if (tabular) {
      fontVariant.push('tabular-nums');
    }

    // Create style object directly
    const textStyle = {
      ...getMargin(theme)({ m, mb, ml, mr, mt, mx, my }),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      color: theme.colors[color as keyof typeof theme.colors][contrastLevel],
      fontSize: theme.font.fontSize[size],
      fontStyle: italic ? 'italic' : 'normal',
      fontVariant,
      // lineHeight: theme.font.fontSize[size].lineHeight * rt.fontScale,
      textAlign: align,
    };

    return (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      <Text ref={ref} {...props} style={[textStyle, style]}>
        {children}
      </Text>
    );
  },
);

Typography.displayName = 'Typography';
