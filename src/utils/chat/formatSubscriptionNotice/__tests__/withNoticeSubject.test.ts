import { withNoticeSubject } from '../withNoticeSubject';

describe('withNoticeSubject', () => {
  test('names the subject when the sentence starts at the verb', () => {
    expect(
      withNoticeSubject('has been a moderator for 18 months!', 'Jimmotep'),
    ).toBe('Jimmotep has been a moderator for 18 months!');
  });

  test('leaves a sentence that already names the subject alone', () => {
    expect(
      withNoticeSubject(
        '500 raiders from RaidLeader have joined!',
        'RaidLeader',
      ),
    ).toBe('500 raiders from RaidLeader have joined!');
  });

  test('matches the subject regardless of case', () => {
    expect(withNoticeSubject('krankel is on a streak!', 'Krankel')).toBe(
      'krankel is on a streak!',
    );
  });

  test('returns an empty string when there is no sentence', () => {
    expect(withNoticeSubject(undefined, 'Jimmotep')).toBe('');
    expect(withNoticeSubject('   ', 'Jimmotep')).toBe('');
  });

  test('names the subject when the sentence only contains it inside a word', () => {
    expect(withNoticeSubject('has been a moderator for 6 months!', 'Mod')).toBe(
      'Mod has been a moderator for 6 months!',
    );
  });

  test('treats punctuation as a word boundary', () => {
    expect(withNoticeSubject('Krankel, welcome back!', 'Krankel')).toBe(
      'Krankel, welcome back!',
    );
  });

  test('matches a display name containing regex characters literally', () => {
    expect(withNoticeSubject('a.c is on a streak!', 'a.c')).toBe(
      'a.c is on a streak!',
    );
    expect(withNoticeSubject('abc is on a streak!', 'a.c')).toBe(
      'a.c abc is on a streak!',
    );
  });

  test('returns the sentence untouched when there is no subject', () => {
    expect(withNoticeSubject('has been a moderator!', undefined)).toBe(
      'has been a moderator!',
    );
  });
});
