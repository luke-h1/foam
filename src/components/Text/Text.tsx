import { ThemeColor } from '@app/styles';
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
      ...props
    }: TextProps,
    ref: LegacyRef<RNText>,
  ) => {
    const { theme } = useUnistyles();

    stylesheet.useVariants({
      variant,
    });

    const fontColor = theme.colors[color];

    return (
      <RNText
        ref={ref}
        {...props}
        style={[{ ...stylesheet.text({ fontColor }) }, style]}
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
    },
  }),
}));

Text.displayName = 'Text';
