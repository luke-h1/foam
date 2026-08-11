import { truncate } from '../string/truncate';

describe('truncate', () => {
  test('returns the original string if tests length is less than or equal to the given number', () => {
    const str = 'Hello, world!';
    expect(truncate(str, 20)).toBe(str);
  });

  test('returns a truncated string with "..." at the end if its length is greater than the given number', () => {
    const str = 'Hello, world!';
    expect(truncate(str, 5)).toBe('Hello...');
  });
});
