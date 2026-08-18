export const FontDisplay = {
  AUTO: 'auto',
  SWAP: 'swap',
  BLOCK: 'block',
  FALLBACK: 'fallback',
  OPTIONAL: 'optional',
} as const;

export const isLoaded = jest.fn(() => true);
export const getLoadedFonts = jest.fn((): string[] => []);
export const isLoading = jest.fn(() => false);
export const loadAsync = jest.fn(() => Promise.resolve());
export const unloadAllAsync = jest.fn(() => Promise.resolve());
export const unloadAsync = jest.fn(() => Promise.resolve());
export const renderToImageAsync = jest.fn(() => Promise.resolve(null));
export const useFonts = jest.fn(() => [true, null]);
