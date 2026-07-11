import { shouldEnterRaidFlushMode } from '../shouldEnterRaidFlushMode';

describe('shouldEnterRaidFlushMode', () => {
  test('enters raid mode when a live flush commits more than 8 messages', () => {
    expect(shouldEnterRaidFlushMode(9, true)).toEqual(true);
  });

  test('stays in normal mode at exactly the 8-message threshold', () => {
    expect(shouldEnterRaidFlushMode(8, true)).toEqual(false);
  });

  test('never enters raid mode while reading scrollback', () => {
    expect(shouldEnterRaidFlushMode(50, false)).toEqual(false);
  });
});
