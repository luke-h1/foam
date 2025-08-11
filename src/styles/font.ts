export const font = {
  fontFamily: 'SFProRounded',
  fontWeight: {
    thin: 300,
    regular: 400,
    semiBold: 600,
    bold: 700,
  },
  fontSize: {
    xxxs: 10,
    xxs: 12,
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 22,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },
};

export type FontSize = keyof typeof font.fontSize;
export type FontWeight = keyof typeof font.fontWeight;
export type FontFamily = typeof font.fontFamily;
