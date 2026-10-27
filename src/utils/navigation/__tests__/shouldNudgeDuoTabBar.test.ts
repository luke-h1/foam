import { shouldNudgeDuoTabBar } from '../shouldNudgeDuoTabBar';

describe('shouldNudgeDuoTabBar', () => {
  test('nudges a landscape iOS window that has a hinge', () => {
    expect(
      shouldNudgeDuoTabBar({
        hingePresent: true,
        platform: 'ios',
        windowHeight: 440,
        windowWidth: 956,
      }),
    ).toEqual(true);
  });

  test('leaves a phone and a portrait Duo alone', () => {
    expect(
      shouldNudgeDuoTabBar({
        hingePresent: false,
        platform: 'ios',
        windowHeight: 440,
        windowWidth: 956,
      }),
    ).toEqual(false);

    expect(
      shouldNudgeDuoTabBar({
        hingePresent: true,
        platform: 'ios',
        windowHeight: 956,
        windowWidth: 440,
      }),
    ).toEqual(false);

    expect(
      shouldNudgeDuoTabBar({
        hingePresent: true,
        platform: 'android',
        windowHeight: 440,
        windowWidth: 956,
      }),
    ).toEqual(false);
  });
});
