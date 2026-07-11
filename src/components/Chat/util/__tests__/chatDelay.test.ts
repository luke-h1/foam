import {
  MAX_AUTO_CHAT_DELAY_MS,
  resolveEffectiveChatDelayMs,
} from '../chatDelay';

describe('resolveEffectiveChatDelayMs', () => {
  test('returns zero when the delay is off', () => {
    expect(resolveEffectiveChatDelayMs('off', 8)).toBe(0);
  });

  test('converts a manual delay to milliseconds', () => {
    expect(resolveEffectiveChatDelayMs(5, 8)).toBe(5000);
  });

  test('clamps negative and non-finite manual delays to zero', () => {
    expect(resolveEffectiveChatDelayMs(-3, null)).toBe(0);
    expect(resolveEffectiveChatDelayMs(Number.NaN, null)).toBe(0);
    expect(resolveEffectiveChatDelayMs(Number.POSITIVE_INFINITY, null)).toBe(0);
  });

  test('auto follows the measured video latency', () => {
    expect(resolveEffectiveChatDelayMs('auto', 8.5)).toBe(8500);
  });

  test('auto is zero until a measurement lands', () => {
    expect(resolveEffectiveChatDelayMs('auto', null)).toBe(0);
  });

  test('auto clamps negative and non-finite measurements to zero', () => {
    expect(resolveEffectiveChatDelayMs('auto', -2)).toBe(0);
    expect(resolveEffectiveChatDelayMs('auto', Number.NaN)).toBe(0);
  });

  test('auto caps the hold at the maximum', () => {
    expect(resolveEffectiveChatDelayMs('auto', 120)).toBe(
      MAX_AUTO_CHAT_DELAY_MS,
    );
  });
});
