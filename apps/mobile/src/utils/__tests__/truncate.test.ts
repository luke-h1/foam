import truncate from '../truncate';

describe('truncate', () => {
  it('should return the original string if its length is less than or equal to the given number', () => {
    const str = 'Hello, world!';
    expect(truncate(str, 20)).toBe(str);
  });

  it('should return a truncated string with "..." at the end if its length is greater than the given number', () => {
    const str = 'Hello, world!';
    expect(truncate(str, 5)).toBe('Hello...');
  });
});
