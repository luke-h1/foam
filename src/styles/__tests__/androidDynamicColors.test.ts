import { Platform } from 'react-native';

const DYNAMIC_PRIMARY = { __opaque: 'android.dynamic.primary' };

jest.mock('expo-router', () => ({
  __esModule: true,
  Color: { android: { dynamic: { primary: DYNAMIC_PRIMARY } } },
}));

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
  jest.resetModules();
});

/**
 * `isAndroidDynamic` and `androidDynamicTint` capture `Platform.OS` at module
 * load, so each platform branch is exercised via a fresh `require` after
 * setting the platform.
 */
function loadModule() {
  return require('../androidDynamicColors') as typeof import('../androidDynamicColors');
}

describe('androidDynamicColors', () => {
  test('resolves the Material You primary at a ColorValue sink on Android', () => {
    Platform.OS = 'android';
    const { isAndroidDynamic, androidDynamicTint } = loadModule();

    expect(isAndroidDynamic).toBe(true);
    expect(androidDynamicTint('#ffffff')).toBe(DYNAMIC_PRIMARY);
  });

  test('falls back to the provided colour on iOS', () => {
    Platform.OS = 'ios';
    const { isAndroidDynamic, androidDynamicTint } = loadModule();

    expect(isAndroidDynamic).toBe(false);
    expect(androidDynamicTint('#ffffff')).toBe('#ffffff');
  });

  test('falls back to the provided colour on web', () => {
    Platform.OS = 'web';
    const { androidDynamicTint } = loadModule();

    expect(androidDynamicTint('#000000')).toBe('#000000');
  });
});
