import { formatCharityAmount } from '../formatCharityAmount';

describe('formatCharityAmount', () => {
  test('formats USD donations without Intl', () => {
    expect(formatCharityAmount('500', '2', 'USD')).toBe('$5.00');
  });

  test('formats EUR donations', () => {
    expect(formatCharityAmount('1250', '2', 'eur')).toBe('€12.50');
  });

  test('falls back to code suffix for unknown currencies', () => {
    expect(formatCharityAmount('100', '2', 'XYZ')).toBe('1.00 XYZ');
  });
});
