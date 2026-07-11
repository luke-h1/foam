import { formatTimeoutDuration } from '../formatTimeoutDuration';

describe('formatTimeoutDuration', () => {
  test('renders whole-minute and whole-hour timeouts as a single unit', () => {
    expect(formatTimeoutDuration(1200)).toEqual('20m');
    expect(formatTimeoutDuration(600)).toEqual('10m');
    expect(formatTimeoutDuration(3600)).toEqual('1h');
    expect(formatTimeoutDuration(86400)).toEqual('1d');
  });

  test('renders sub-minute and mixed durations', () => {
    expect(formatTimeoutDuration(30)).toEqual('30s');
    expect(formatTimeoutDuration(90)).toEqual('1m 30s');
    expect(formatTimeoutDuration(90061)).toEqual('1d 1h 1m 1s');
  });

  test('falls back to 0s for non-positive or invalid input', () => {
    expect(formatTimeoutDuration(0)).toEqual('0s');
    expect(formatTimeoutDuration(-5)).toEqual('0s');
    expect(formatTimeoutDuration(Number.NaN)).toEqual('0s');
  });
});
