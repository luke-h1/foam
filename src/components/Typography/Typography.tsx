import { FontSize, FontWeight, ThemeColor } from '@app/styles';
import { forwardRef, LegacyRef, ReactNode } from 'react';
import { Text, TextProps } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export interface TypographyProps extends TextProps {
  weight?: FontWeight;
  size?: FontSize;
  color?: ThemeColor;
  children: ReactNode;
}

export const typographyStyles = createStyleSheet(() => ({
  text: ({ fontWeight, fontSize, textColor }) => ({
    fontWeight,
    fontSize,
    color: textColor,
    fontFamily: 'Inter',
  }),
}));

export const Typography = forwardRef(
  (
    {
      weight = 'regular',
      size = 'md',
      color = 'text',
      children,
      style,
      ...props
    }: TypographyProps,
    ref: LegacyRef<Text>,
  ) => {
    const { styles, theme } = useStyles(typographyStyles);

    const fontWeight = theme.font.fontWeight[weight];
    const fontSize = theme.font.fontSize[size];
    const textColor = theme.colors[color];

    return (
      <Text
        ref={ref}
        {...props}
        style={[{ ...styles.text({ fontSize, fontWeight, textColor }) }, style]}
      >
        {children}
      </Text>
    );
  },
);

Typography.displayName = 'Text';
