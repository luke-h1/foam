import type { Platform } from 'react-native';

const DYNAMIC_PRIMARY = { __opaque: 'android.dynamic.primary' };

jest.mock('expo-router', () => ({
  __esModule: true,
  Color: { android: { dynamic: { primary: DYNAMIC_PRIMARY } } },
}));

/**
 * `isAndroidDynamic` and `androidDynamicTint` capture `Platform.OS` at module
 * load, so each branch is exercised by setting the platform and loading the
 * module inside one isolated registry - the `react-native` the module requires
 * is the same instance we mutate here, independent of test order.
 */
function loadWithPlatform(os: typeof Platform.OS) {
  const holder: { mod?: typeof import('../androidDynamicColors') } = {};
  jest.isolateModules(() => {
    (require('react-native') as typeof import('react-native')).Platform.OS = os;
    holder.mod = require('../androidDynamicColors');
  });
  if (!holder.mod) {
    throw new Error('androidDynamicColors failed to load');
  }
  return holder.mod;
}

describe('androidDynamicColors', () => {
  test('resolves the Material You primary at a ColorValue sink on Android', () => {
    const { isAndroidDynamic, androidDynamicTint } =
      loadWithPlatform('android');

    expect(isAndroidDynamic).toBe(true);
    expect(androidDynamicTint('#ffffff')).toBe(DYNAMIC_PRIMARY);
  });

  test('falls back to the provided colour on iOS', () => {
    const { isAndroidDynamic, androidDynamicTint } = loadWithPlatform('ios');

    expect(isAndroidDynamic).toBe(false);
    expect(androidDynamicTint('#ffffff')).toBe('#ffffff');
  });

  test('falls back to the provided colour on web', () => {
    const { androidDynamicTint } = loadWithPlatform('web');

    expect(androidDynamicTint('#000000')).toBe('#000000');
  });
});
