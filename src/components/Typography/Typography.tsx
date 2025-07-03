import { FontSize, FontWeight, ThemeColor } from '@app/styles';
import { forwardRef, LegacyRef, ReactNode } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Text, TextProps } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export interface TypographyProps extends TextProps {
  weight?: FontWeight;
  size?: FontSize;
  color?: ThemeColor;
  children: ReactNode;
  animated?: boolean;
}

export const typographyStyles = createStyleSheet(() => ({
  text: ({ fontWeight, fontSize, textColor }) => ({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fontWeight,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fontSize,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      animated,
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
