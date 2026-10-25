import { Platform } from 'react-native';

import { pickFlushDelay } from '../pickFlushDelay';

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
});

describe('pickFlushDelay', () => {
  test('returns the 100ms live interval on iOS when following the bottom', () => {
    Platform.OS = 'ios';
    expect(
      pickFlushDelay({
        isAtBottom: true,
        raidMode: false,
        scrollingToBottom: false,
      }),
    ).toEqual(100);
  });

  test('returns the 150ms live interval on Android when following the bottom', () => {
    Platform.OS = 'android';
    expect(
      pickFlushDelay({
        isAtBottom: true,
        raidMode: false,
        scrollingToBottom: false,
      }),
    ).toEqual(150);
  });

  test('returns the slowed 180ms interval when following the bottom in raid mode', () => {
    expect(
      pickFlushDelay({
        isAtBottom: true,
        raidMode: true,
        scrollingToBottom: false,
      }),
    ).toEqual(180);
  });

  test('returns the live interval while scrolling back to the bottom', () => {
    Platform.OS = 'ios';
    expect(
      pickFlushDelay({
        isAtBottom: false,
        raidMode: false,
        scrollingToBottom: true,
      }),
    ).toEqual(100);
  });

  test('returns the raid interval while scrolling back to the bottom in raid mode', () => {
    expect(
      pickFlushDelay({
        isAtBottom: false,
        raidMode: true,
        scrollingToBottom: true,
      }),
    ).toEqual(180);
  });

  test('returns the 250ms backlog interval while reading scrollback', () => {
    expect(
      pickFlushDelay({
        isAtBottom: false,
        raidMode: false,
        scrollingToBottom: false,
      }),
    ).toEqual(250);
  });

  test('backlog interval wins over raid mode while reading scrollback', () => {
    expect(
      pickFlushDelay({
        isAtBottom: false,
        raidMode: true,
        scrollingToBottom: false,
      }),
    ).toEqual(250);
  });
});
