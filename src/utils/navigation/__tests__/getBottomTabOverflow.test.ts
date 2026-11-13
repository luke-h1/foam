import { getBottomTabOverflow } from '../getBottomTabOverflow';

describe('getBottomTabOverflow', () => {
  test('returns the context height when the JS navigator provides one', () => {
    expect(
      getBottomTabOverflow({
        contextTabBarHeight: 83,
        fallbackTabBarHeight: 104,
        hingePresent: false,
        platform: 'ios',
        windowHeight: 852,
        windowWidth: 393,
      }),
    ).toEqual(83);
  });

  test('returns zero on the Duo outer display, which has a side rail', () => {
    expect(
      getBottomTabOverflow({
        contextTabBarHeight: undefined,
        fallbackTabBarHeight: 104,
        hingePresent: true,
        platform: 'ios',
        windowHeight: 678,
        windowWidth: 466,
      }),
    ).toEqual(0);
  });

  test('returns zero on the Duo inner display in landscape', () => {
    expect(
      getBottomTabOverflow({
        contextTabBarHeight: undefined,
        fallbackTabBarHeight: 104,
        hingePresent: true,
        platform: 'ios',
        windowHeight: 669,
        windowWidth: 951,
      }),
    ).toEqual(0);
  });

  test('returns the fallback on the Duo inner display in portrait, which keeps a bottom bar', () => {
    expect(
      getBottomTabOverflow({
        contextTabBarHeight: undefined,
        fallbackTabBarHeight: 104,
        hingePresent: true,
        platform: 'ios',
        windowHeight: 951,
        windowWidth: 669,
      }),
    ).toEqual(104);
  });

  test('returns the fallback on a phone', () => {
    expect(
      getBottomTabOverflow({
        contextTabBarHeight: undefined,
        fallbackTabBarHeight: 104,
        hingePresent: false,
        platform: 'ios',
        windowHeight: 852,
        windowWidth: 393,
      }),
    ).toEqual(104);
  });

  test('returns the fallback on an Android foldable', () => {
    expect(
      getBottomTabOverflow({
        contextTabBarHeight: undefined,
        fallbackTabBarHeight: 104,
        hingePresent: true,
        platform: 'android',
        windowHeight: 669,
        windowWidth: 951,
      }),
    ).toEqual(104);
  });
});
