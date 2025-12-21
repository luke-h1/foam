import { truncate } from '../string/truncate';

describe('truncate', () => {
  test('should return the original string if tests length is less than or equal to the given number', () => {
    const str = 'Hello, world!';
    expect(truncate(str, 20)).toBe(str);
  });

  test('should return a truncated string with "..." at the end if its length is greater than the given number', () => {
    const str = 'Hello, world!';
    expect(truncate(str, 5)).toBe('Hello...');
  });
});
