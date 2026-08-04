import { Platform } from 'react-native';

import { maxLiveCommitPerFlush } from '../maxLiveCommitPerFlush';

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
});

describe('maxLiveCommitPerFlush', () => {
  test('caps a live flush, with a smaller budget on android', () => {
    Platform.OS = 'ios';
    expect(maxLiveCommitPerFlush(true)).toBe(8);

    Platform.OS = 'android';
    expect(maxLiveCommitPerFlush(true)).toBe(4);
  });

  test('leaves the backlog uncapped while reading scrollback', () => {
    Platform.OS = 'ios';
    expect(maxLiveCommitPerFlush(false)).toBeUndefined();

    Platform.OS = 'android';
    expect(maxLiveCommitPerFlush(false)).toBeUndefined();
  });
});
