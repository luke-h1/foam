import { formatDuration } from '../formatStreamDuration';

describe('formatStreamDuration', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('formats live durations with and without hours', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-19T16:30:00Z'));

    expect(formatDuration()).toBe('0:00');
    expect(formatDuration('2026-05-19T16:28:05Z')).toBe('1:55');
    expect(formatDuration('2026-05-19T14:28:05Z')).toBe('2:01:55');

    jest.useRealTimers();
  });
});
