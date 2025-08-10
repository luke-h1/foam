export const typography = {
  family: 'SFProRounded',
  weight: {
    thin: 300,
    regular: 400,
    semiBold: 600,
    bold: 700,
  },
  size: {
    xs: {
      fontSize: 12,
      lineHeight: 16,
    },
    sm: {
      fontSize: 14,
      lineHeight: 20,
    },
    md: {
      fontSize: 16,
      lineHeight: 24,
    },
    lg: {
      fontSize: 18,
      lineHeight: 26,
    },
    xl: {
      fontSize: 20,
      lineHeight: 28,
    },
    '2xl': {
      fontSize: 24,
      lineHeight: 30,
    },
    '3xl': {
      fontSize: 28,
      lineHeight: 36,
    },
    '4xl': {
      fontSize: 35,
      lineHeight: 40,
    },
    '5xl': {
      fontSize: 60,
      lineHeight: 60,
    },
  },
};

export type TypographySize = keyof typeof typography.size;
export type TypographyWeight = keyof typeof typography.weight;
export type TypographyFamily = keyof typeof typography.family;
