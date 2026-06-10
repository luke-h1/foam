import { normaliseChatUsername } from '../chatUsernames';

describe('normaliseChatUsername', () => {
  test('returns an empty string for nullish values', () => {
    expect(normaliseChatUsername(null)).toBe('');
    expect(normaliseChatUsername(undefined)).toBe('');
  });

  test('trims whitespace', () => {
    expect(normaliseChatUsername('  TestUser  ')).toBe('testuser');
  });

  test('removes a leading @ and lowercases', () => {
    expect(normaliseChatUsername('@TestUser')).toBe('testuser');
  });

  test('leaves usernames without @ unchanged apart from casing', () => {
    expect(normaliseChatUsername('TestUser')).toBe('testuser');
  });

  test('returns an empty string for whitespace-only input', () => {
    expect(normaliseChatUsername('   ')).toBe('');
  });
});
