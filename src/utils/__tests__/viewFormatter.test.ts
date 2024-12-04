import viewFormatter from '../viewFormatter';

describe('viewFormatter', () => {
  test('should format the number correctly', () => {
    expect(viewFormatter(1, 1)).toBe('1');
    expect(viewFormatter(1000, 1)).toBe('1K');
    expect(viewFormatter(1500, 1)).toBe('1.5K');
    expect(viewFormatter(1000000, 2)).toBe('1M');
    expect(viewFormatter(1500000, 2)).toBe('1.5M');
  });
});
