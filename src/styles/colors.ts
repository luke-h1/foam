export const colorTokens = [
  // accents
  'accent',
  'gray',

  // Blue variants
  'blue',
  'sky',
  'cyan',
  'indigo',
  'iris',

  // Purple variants
  'violet',
  'purple',
  'plum',

  'red',
  'green',
] as const;

export type ThemeColor = (typeof colorTokens)[number];
