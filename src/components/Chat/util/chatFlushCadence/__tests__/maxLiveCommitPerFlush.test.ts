import { Platform } from 'react-native';

import { maxLiveCommitPerFlush } from '../maxLiveCommitPerFlush';

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
});

describe('maxLiveCommitPerFlush', () => {
  test('caps a live flush, with a smaller budget on android', () => {
    Platform.OS = 'ios';
    expect(maxLiveCommitPerFlush(true, false)).toBe(8);

    Platform.OS = 'android';
    expect(maxLiveCommitPerFlush(true, false)).toBe(4);
  });

  test('raises the cap under raid mode to match its wider flush interval', () => {
    Platform.OS = 'ios';
    expect(maxLiveCommitPerFlush(true, true)).toBe(15);

    Platform.OS = 'android';
    expect(maxLiveCommitPerFlush(true, true)).toBe(8);
  });

  test('leaves the backlog uncapped while reading scrollback', () => {
    Platform.OS = 'ios';
    expect(maxLiveCommitPerFlush(false, false)).toBeUndefined();
    expect(maxLiveCommitPerFlush(false, true)).toBeUndefined();

    Platform.OS = 'android';
    expect(maxLiveCommitPerFlush(false, false)).toBeUndefined();
    expect(maxLiveCommitPerFlush(false, true)).toBeUndefined();
  });
});
