import { ThemeColor, FontWeight, FontSize, Spacing } from '@app/styles';
import { forwardRef, LegacyRef, ReactNode } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

type TextVariant =
  | 'largeTitle'
  | 'title'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'footnote'
  | 'caption'
  | 'caption2'
  | 'chatMessage'
  | 'subtitle';

export interface TextProps extends RNTextProps {
  color?: ThemeColor;
  children: ReactNode;
  animated?: boolean;
  variant?: TextVariant;
  // Design system props
  weight?: FontWeight;
  size?: FontSize;
  highContrast?: boolean;
  // Spacing props
  m?: Spacing;
  mx?: Spacing;
  my?: Spacing;
  mt?: Spacing;
  mr?: Spacing;
  mb?: Spacing;
  ml?: Spacing;
  p?: Spacing;
  px?: Spacing;
  py?: Spacing;
  pt?: Spacing;
  pr?: Spacing;
  pb?: Spacing;
  pl?: Spacing;
}

export const Text = forwardRef(
  (
    {
      color = 'text',
      children,
      style,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      animated,
      variant = 'body',
      weight,
      size,
      highContrast = true,
      // Spacing props
      m,
      mx,
      my,
      mt,
      mr,
      mb,
      ml,
      p,
      px,
      py,
      pt,
      pr,
      pb,
      pl,
      ...props
    }: TextProps,
    ref: LegacyRef<RNText>,
  ) => {
    const { theme } = useUnistyles();

    stylesheet.useVariants({
      variant,
      weight,
      size,
      highContrast,
    });

    const fontColor = theme.colors[color];

    // Build spacing styles
    const spacingStyle = {
      ...(m !== undefined && { margin: theme.spacing[m] }),
      ...(mx !== undefined && { marginHorizontal: theme.spacing[mx] }),
      ...(my !== undefined && { marginVertical: theme.spacing[my] }),
      ...(mt !== undefined && { marginTop: theme.spacing[mt] }),
      ...(mr !== undefined && { marginRight: theme.spacing[mr] }),
      ...(mb !== undefined && { marginBottom: theme.spacing[mb] }),
      ...(ml !== undefined && { marginLeft: theme.spacing[ml] }),
      ...(p !== undefined && { padding: theme.spacing[p] }),
      ...(px !== undefined && { paddingHorizontal: theme.spacing[px] }),
      ...(py !== undefined && { paddingVertical: theme.spacing[py] }),
      ...(pt !== undefined && { paddingTop: theme.spacing[pt] }),
      ...(pr !== undefined && { paddingRight: theme.spacing[pr] }),
      ...(pb !== undefined && { paddingBottom: theme.spacing[pb] }),
      ...(pl !== undefined && { paddingLeft: theme.spacing[pl] }),
    };

    return (
      <RNText
        ref={ref}
        {...props}
        style={[{ ...stylesheet.text({ fontColor }) }, spacingStyle, style]}
      >
        {children}
      </RNText>
    );
  },
);

const stylesheet = StyleSheet.create(theme => ({
  text: ({ fontColor }) => ({
    color: fontColor as ThemeColor,
    fontFamily: theme.font.fontFamily,
    variants: {
      variant: {
        largeTitle: {
          fontSize: 34,
          fontWeight: 'bold',
          lineHeight: 41,
          letterSpacing: 0.4,
        },
        title: {
          fontSize: 28,
          fontWeight: 'bold',
          lineHeight: 34,
          letterSpacing: 0.3,
        },
        title2: {
          fontSize: 22,
          fontWeight: 'bold',
          lineHeight: 28,
          letterSpacing: 0.2,
        },
        title3: {
          fontSize: 20,
          lineHeight: 26,
          letterSpacing: 0.2,
        },
        headline: {
          fontSize: 17,
          fontWeight: '600',
          lineHeight: 22,
          letterSpacing: 0.1,
        },
        subtitle: {
          fontSize: theme.spacing.lg,
        },
        body: {
          color: theme.colors.text,
          fontSize: theme.spacing.xl,
          lineHeight: 22,
          letterSpacing: 0.1,
        },
        callout: {
          fontSize: theme.spacing.xl,
          lineHeight: 21,
          letterSpacing: 0.1,
        },
        footnote: {
          fontSize: theme.spacing.lg,
          lineHeight: 18,
          letterSpacing: 0.0,
        },
        caption: {
          fontSize: 14,
          lineHeight: 16,
          letterSpacing: 0.0,
        },
        caption2: {
          fontSize: 11,
          lineHeight: 15,
          letterSpacing: 0.0,
        },
        chatMessage: {
          fontSize: theme.spacing.lg + theme.spacing.xs,
        },
      },
      weight: {
        thin: { fontWeight: theme.font.fontWeight.thin },
        regular: { fontWeight: theme.font.fontWeight.regular },
        semiBold: { fontWeight: theme.font.fontWeight.semiBold },
        bold: { fontWeight: theme.font.fontWeight.bold },
        medium: { fontWeight: theme.font.fontWeight.semiBold }, // alias for semiBold
      },
      size: {
        xxs: { fontSize: theme.font.fontSize.xxs },
        xs: { fontSize: theme.font.fontSize.xs },
        sm: { fontSize: theme.font.fontSize.sm },
        md: { fontSize: theme.font.fontSize.md },
        lg: { fontSize: theme.font.fontSize.lg },
        xl: { fontSize: theme.font.fontSize.xl },
        '2xl': { fontSize: theme.font.fontSize['2xl'] },
        '3xl': { fontSize: theme.font.fontSize['3xl'] },
        '4xl': { fontSize: theme.font.fontSize['4xl'] },
        '1': { fontSize: theme.font.fontSize.xs }, // size="1" maps to xs
        '2': { fontSize: theme.font.fontSize.sm }, // size="2" maps to sm
      },
      highContrast: {
        true: {},
        false: {
          opacity: 0.7,
        },
      },
    },
  }),
}));

Text.displayName = 'Text';
