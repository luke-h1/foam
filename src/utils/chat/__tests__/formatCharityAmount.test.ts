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

  test('renders suffix-position currencies after the number', () => {
    expect(formatCharityAmount('1500', '2', 'DKK')).toBe('15.00 kr');
    expect(formatCharityAmount('1500', '2', 'PLN')).toBe('15.00 zł');
  });

  test('honours an exponent of 0 with no decimal places', () => {
    expect(formatCharityAmount('500', '0', 'USD')).toBe('$500');
  });

  test('defaults an empty amount to zero', () => {
    expect(formatCharityAmount('', '2', 'USD')).toBe('$0.00');
  });
});
