import { isSingleChannel } from '../isSingleChannel';

describe('isSingleChannel', () => {
  test('should return true when only red channel is non-zero', () => {
    expect(isSingleChannel(255, 0, 0)).toBe(true);
  });

  test('should return true when only green channel is non-zero', () => {
    expect(isSingleChannel(0, 255, 0)).toBe(true);
  });

  test('should return true when only blue channel is non-zero', () => {
    expect(isSingleChannel(0, 0, 255)).toBe(true);
  });

  test('should return false when two channels are non-zero', () => {
    expect(isSingleChannel(255, 255, 0)).toBe(false);
    expect(isSingleChannel(255, 0, 255)).toBe(false);
    expect(isSingleChannel(0, 255, 255)).toBe(false);
  });

  test('should return false when all channels are non-zero', () => {
    expect(isSingleChannel(255, 255, 255)).toBe(false);
  });

  test('should return false when all channels are zero', () => {
    expect(isSingleChannel(0, 0, 0)).toBe(false);
  });

  test('should handle non-integer values', () => {
    expect(isSingleChannel(0.5, 0, 0)).toBe(true);
    expect(isSingleChannel(0, 0.5, 0.5)).toBe(false);
  });

  test('should handle negative values', () => {
    expect(isSingleChannel(-1, 0, 0)).toBe(false);
    expect(isSingleChannel(0, -1, 0)).toBe(false);
    expect(isSingleChannel(0, 0, -1)).toBe(false);
  });
});
