import { textMentionsUser } from '../textMentionsUser';

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
