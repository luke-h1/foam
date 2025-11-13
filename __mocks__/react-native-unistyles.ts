/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock for react-native-unistyles - mainly for reassure tests

const mockTheme = {
  colors: {
    gray: {
      text: '#000000',
      textLow: '#666666',
      contrast: '#FFFFFF',
      accent: '#8E8E93',
      accentAlpha: 'rgba(142, 142, 147, 0.5)',
      bgAltAlpha: 'rgba(142, 142, 147, 0.1)',
    },
    blue: {
      text: '#007AFF',
      textLow: '#0051D5',
      contrast: '#FFFFFF',
      accent: '#007AFF',
      accentAlpha: 'rgba(0, 122, 255, 0.5)',
    },
    red: {
      text: '#FF3B30',
      textLow: '#D70015',
      contrast: '#FFFFFF',
    },
    green: {
      text: '#34C759',
      textLow: '#248A3D',
      contrast: '#FFFFFF',
    },
    grass: {
      accentAlpha: '#34C759',
    },
    black: {
      bgAltAlpha: 'rgba(0, 0, 0, 0.1)',
    },
  },
  font: {
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
    fontWeight: {
      thin: 300,
      regular: 400,
      semiBold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 56,
    '7xl': 64,
    headerHeight: 56,
    tabBarHeight: 70,
  },
};

// Mock HybridUnistylesStyleSheet class
class HybridUnistylesStyleSheet {
  static init() {
    // No-op for tests
  }
}

const mockStyleSheet = {
  create: jest.fn((styles: any) => styles),
  flatten: jest.fn((style: any) => style),
  configure: jest.fn(() => {
    // Call init when configure is called (mimicking real behavior)
    HybridUnistylesStyleSheet.init();
  }),
};

export const StyleSheet = mockStyleSheet;

export const UnistylesRuntime = {
  init: jest.fn(),
  setTheme: jest.fn(),
  setBreakpoint: jest.fn(),
  useStyles: jest.fn(() => ({})),
  getTheme: jest.fn(() => mockTheme),
};

export const createStyleSheet = jest.fn(() => ({}));

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const withUnistyles = jest.fn((Component: any) => Component);

export function useUnistyles() {
  return {
    theme: mockTheme,
  };
}

// Export HybridUnistylesStyleSheet for internal use
export { HybridUnistylesStyleSheet };
