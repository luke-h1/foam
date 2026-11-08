import { createChatTimestamp } from '../createChatTimestamp';

describe('createChatTimestamp', () => {
  const afternoon = new Date(2026, 10, 8, 15, 4);

  test('formats a 24-hour timestamp', () => {
    expect(createChatTimestamp('24h', afternoon)).toBe('15:04');
  });

  test('formats a 12-hour timestamp', () => {
    expect(createChatTimestamp('12h', afternoon)).toBe('3:04 PM');
  });
});
