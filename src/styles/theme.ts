import { Platform } from 'react-native';

const theme = {
  color: {
    white: '#fff',
    black: '#000',
    red: '#D72638',
    darkBlue: '#051726',
    darkestBlue: '#091725',
    lightGreen: '#9BDFB1',
    darkGreen: '#1AC9A2',
    grey: '#adb5bd',
    lightGrey: '#FCFBFE',
  },
  fontSize: {
    sm: 16,
    md: 18,
    lg: 24,
    xl: 32,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  fontFamily: {
    light: 'FreightSansProLight-Regular',
    lightItalic: 'FreightSansProLight-Italic',
    regular: 'FreightSansProBook-Regular',
    italic: 'FreightSansProBook-Italic',
    bold: 'FreightSansProBold-Regular',
    boldItalic: 'FreightSansProBold-Italic',
  },
  borderradii: {
    sm: 6,
    md: 10,
    lg: 20,
  },
  dropShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#adb5bd',
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.4,
        shadowRadius: 2,
      },
      default: {},
    }),
  },
} as const;

export default theme;
