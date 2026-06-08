import { calculateAspectRatio, fitWithinMaxBox } from '../calculateAspectRatio';

describe('calculateAspectRatio', () => {
  test('should maintain aspect ratio for landscape image', () => {
    const result = calculateAspectRatio(1920, 1080, 100);
    expect(result).toEqual({
      width: 177.77777777777777,
      height: 100,
    });
  });

  test('should maintain aspect ratio for portrait image', () => {
    const result = calculateAspectRatio(1080, 1920, 100);
    expect(result).toEqual({
      width: 56.25,
      height: 100,
    });
  });

  test('should maintain aspect ratio for square image', () => {
    const result = calculateAspectRatio(100, 100, 100);
    expect(result).toEqual({
      width: 100,
      height: 100,
    });
  });
});

describe('fitWithinMaxBox', () => {
  test('scales square assets up to the max box size', () => {
    expect(fitWithinMaxBox(28, 28, 120)).toEqual({
      width: 120,
      height: 120,
    });
  });

  test('fits wide assets within the max box size', () => {
    expect(fitWithinMaxBox(112, 28, 120)).toEqual({
      width: 120,
      height: 30,
    });
  });

  test('fits tall assets within the max box size', () => {
    expect(fitWithinMaxBox(28, 112, 120)).toEqual({
      width: 30,
      height: 120,
    });
  });
});
