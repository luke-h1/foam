import { subMinutes } from 'date-fns';
import { elapsedStreamTime } from '../string/elapsedStreamTime';

describe('elapsedStreamTime', () => {
  test('should return minutes when elapsed time is less than one hour', () => {
    const start = subMinutes(new Date(), 45).toISOString();
    expect(elapsedStreamTime(start)).toEqual('45m');
  });

  test('should return hours and minutes when the elapsed time is exactly one hour', () => {
    const start = subMinutes(new Date(), 60).toISOString();
    expect(elapsedStreamTime(start)).toEqual('01h 00m');
  });

  test('should return hours and minutes when the elapsed time is more than one hour', () => {
    const start = subMinutes(new Date(), 125).toISOString();
    expect(elapsedStreamTime(start)).toBe('02h 05m');
  });

  test('should return hours and minutes when the elapsed time is more than 24 hours', () => {
    const start = subMinutes(new Date(), 1500).toISOString(); // 25 hours
    expect(elapsedStreamTime(start)).toBe('25h 00m');
  });
});
