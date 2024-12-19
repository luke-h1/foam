interface ColorPalete {
  // neutral
  neutral100: string;
  neutral200: string;
  neutral300: string;
  neutral400: string;
  neutral500: string;
  neutral600: string;
  neutral700: string;
  neutral800: string;

  // primary
  primary100: string;
  primary200: string;
  primary300: string;
  primary400: string;
  primary500: string;
  primary600: string;
  primary700: string;
  primary800: string;

  // secondary
  secondary100: string;
  secondary200: string;
  secondary300: string;
  secondary400: string;
  secondary500: string;
  secondary600: string;
  secondary700: string;
  secondary800: string;

  // bold
  bold100: string;
  bold200: string;
  bold300: string;
  bold400: string;
  bold500: string;
  bold600: string;
  bold700: string;
  bold800: string;

  // highlight
  highlight100: string;
  highlight200: string;
  highlight300: string;
  highlight400: string;
  highlight500: string;
  highlight600: string;
  highlight700: string;
  highlight800: string;

  // angry
  angry100: string;
  angry500: string;
}

const palette: ColorPalete = {
  // neutral
  neutral100: '#121212',
  neutral200: '#1D1D1D',
  neutral300: '#242424',
  neutral400: '#2C2C2C',
  neutral500: '#333333',
  neutral600: '#3B3B3B',
  neutral700: '#424242',
  neutral800: '#4A4A4A',

  // primary
  primary100: '#0D47A1',
  primary200: '#1565C0',
  primary300: '#1976D2',
  primary400: '#1E88E5',
  primary500: '#2196F3',
  primary600: '#42A5F5',
  primary700: '#64B5F6',
  primary800: '#90CAF9',

  // secondary
  secondary100: '#004D40',
  secondary200: '#00695C',
  secondary300: '#00796B',
  secondary400: '#00897B',
  secondary500: '#009688',
  secondary600: '#26A69A',
  secondary700: '#4DB6AC',
  secondary800: '#80CBC4',

  // bold
  bold100: '#BF360C',
  bold200: '#D84315',
  bold300: '#E64A19',
  bold400: '#F4511E',
  bold500: '#FF5722',
  bold600: '#FF7043',
  bold700: '#FF8A65',
  bold800: '#FFAB91',

  // highlight
  highlight100: '#F57F17',
  highlight200: '#F9A825',
  highlight300: '#FBC02D',
  highlight400: '#FDD835',
  highlight500: '#FFEB3B',
  highlight600: '#FFEE58',
  highlight700: '#FFF176',
  highlight800: '#FFF59D',

  // angry
  angry100: '#B71C1C',
  angry500: '#D32F2F',
} as const;

export const colors = {
  /**
   * The palette is available to use, but prefer using the name.
   * This is only included for rare, one-off cases. Try to use
   * semantic names as much as possible.
   */
  palette,
  /**
   * A helper for making something see-thru.
   */
  transparent: 'rgba(0, 0, 0, 0)',
  /**
   * The default text color in many components.
   */
  text: palette.neutral100,
  /**
   * Secondary text information.
   */
  textDim: palette.primary100,
  /**
   * The default color of the screen background.
   */
  background: palette.neutral700,
  /**
   * The default border color.
   */
  border: palette.primary500,
  /**
   * The main tinting color.
   */
  tint: palette.primary500,
  /**
   * A subtle color used for lines.
   */
  separator: palette.neutral400,
  /**
   * Error messages.
   */
  error: palette.angry500,
  /**
   * Error Background.
   *
   */
  errorBackground: palette.angry100,
};
