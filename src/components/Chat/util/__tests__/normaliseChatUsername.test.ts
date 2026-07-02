import { normaliseChatUsername, textMentionsUser } from '../chatUsernames';

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

describe('textMentionsUser', () => {
  test('matches a bare @mention regardless of casing', () => {
    expect(textMentionsUser('hello @Alice welcome', 'alice')).toBe(true);
  });

  test('matches an @mention with trailing punctuation', () => {
    expect(textMentionsUser('@alice, welcome', 'alice')).toBe(true);
    expect(textMentionsUser('hey @Alice: look at this', 'alice')).toBe(true);
    expect(textMentionsUser('gg @alice!', 'alice')).toBe(true);
  });

  test('does not match a different user or a partial prefix', () => {
    expect(textMentionsUser('hello @alicetwo', 'alice')).toBe(false);
    expect(textMentionsUser('hello @bob', 'alice')).toBe(false);
  });

  test('does not match tokens without an @ prefix', () => {
    expect(textMentionsUser('alice is here', 'alice')).toBe(false);
  });

  test('returns false for an empty normalised user', () => {
    expect(textMentionsUser('hello @alice', '')).toBe(false);
  });
});
