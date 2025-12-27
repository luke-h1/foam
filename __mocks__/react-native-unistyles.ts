/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Default color structure for each color token
const createColorScale = (base: string) => ({
  bg: base,
  bgAlt: base,
  ui: base,
  uiHover: base,
  uiActive: base,
  border: base,
  borderUi: base,
  borderHover: base,
  accent: base,
  accentHover: base,
  textLow: base,
  text: base,
  bgAlpha: base,
  bgAltAlpha: base,
  uiAlpha: base,
  uiHoverAlpha: base,
  uiActiveAlpha: base,
  borderAlpha: base,
  borderUiAlpha: base,
  borderHoverAlpha: base,
  accentAlpha: base,
  accentHoverAlpha: base,
  textLowAlpha: base,
  textAlpha: base,
  contrast: '#FFFFFF',
});

const mockTheme = {
  colors: {
    accent: createColorScale('#007AFF'),
    gray: createColorScale('#8E8E93'),
    blue: createColorScale('#007AFF'),
    sky: createColorScale('#0EA5E9'),
    cyan: createColorScale('#06B6D4'),
    indigo: createColorScale('#6366F1'),
    iris: createColorScale('#5B5BD6'),
    violet: createColorScale('#8B5CF6'),
    purple: createColorScale('#A855F7'),
    plum: createColorScale('#D946EF'),
    red: createColorScale('#EF4444'),
    green: createColorScale('#22C55E'),
    amber: createColorScale('#F59E0B'),
    crimson: createColorScale('#DC2626'),
    gold: createColorScale('#CA8A04'),
    grass: createColorScale('#22C55E'),
    jade: createColorScale('#10B981'),
    orange: createColorScale('#F97316'),
    ruby: createColorScale('#E11D48'),
    teal: createColorScale('#14B8A6'),
    tomato: createColorScale('#EF4444'),
    black: createColorScale('#000000'),
    white: createColorScale('#FFFFFF'),
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
  radii: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

// Mock HybridUnistylesStyleSheet class
class HybridUnistylesStyleSheet {
  static init() {
    // No-op for tests
  }
}

const mockStyleSheet = {
  create: jest.fn((styles: any) => {
    // If styles is a function, call it with mockTheme
    const resolvedStyles =
      typeof styles === 'function' ? styles(mockTheme) : styles;
    // Add useVariants method to the returned styles object
    return Object.assign(resolvedStyles, {
      useVariants: jest.fn(),
    });
  }),
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
