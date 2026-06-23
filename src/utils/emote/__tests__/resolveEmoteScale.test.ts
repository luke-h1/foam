import {
  isSevenTvEmoteSite,
  resolveEmotePreferredScale,
} from '../resolveEmoteScale';

describe('isSevenTvEmoteSite', () => {
  test.each(['7TV Channel', '7TV Global', '7TV Personal'])(
    'is true for %s',
    site => {
      expect(isSevenTvEmoteSite(site)).toBe(true);
    },
  );

  test.each(['BTTV', 'Global BTTV', 'FFZ', 'Twitch', undefined, null])(
    'is false for %s',
    site => {
      expect(isSevenTvEmoteSite(site)).toBe(false);
    },
  );
});

describe('resolveEmotePreferredScale', () => {
  test('low-RAM devices always get 1x', () => {
    expect(
      resolveEmotePreferredScale({
        isSevenTv: false,
        sevenTvLowRes: false,
        isLowEnd: true,
      }),
    ).toBe('1x');
  });

  test('7TV emotes get 1x when the flag is on', () => {
    expect(
      resolveEmotePreferredScale({ isSevenTv: true, sevenTvLowRes: true }),
    ).toBe('1x');
  });

  test('7TV emotes stay 2x when the flag is off', () => {
    expect(
      resolveEmotePreferredScale({ isSevenTv: true, sevenTvLowRes: false }),
    ).toBe('2x');
  });

  test('non-7TV emotes stay 2x even when the flag is on', () => {
    expect(
      resolveEmotePreferredScale({ isSevenTv: false, sevenTvLowRes: true }),
    ).toBe('2x');
  });
});
