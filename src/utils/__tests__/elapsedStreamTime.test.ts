import { subMinutes } from 'date-fns';

import { elapsedStreamTime } from '../string/elapsedStreamTime';

const NOW = new Date('2026-07-10T12:00:00.000Z');

describe('elapsedStreamTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should return minutes when elapsed time is less than one hour', () => {
    const start = subMinutes(NOW, 45).toISOString();
    expect(elapsedStreamTime(start)).toEqual('45m');
  });

  test('should return hours and minutes when the elapsed time is exactly one hour', () => {
    const start = subMinutes(NOW, 60).toISOString();
    expect(elapsedStreamTime(start)).toEqual('1h 00m');
  });

  test('should return hours and minutes when the elapsed time is more than one hour', () => {
    const start = subMinutes(NOW, 125).toISOString();
    expect(elapsedStreamTime(start)).toBe('2h 05m');
  });

  test('should return hours and minutes when the elapsed time is more than 24 hours', () => {
    const start = subMinutes(NOW, 1500).toISOString(); // 25 hours
    expect(elapsedStreamTime(start)).toBe('25h 00m');
  });
});
