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

  test('returns the sentence untouched when there is no subject', () => {
    expect(withNoticeSubject('has been a moderator!', undefined)).toBe(
      'has been a moderator!',
    );
  });
});
