import { splitNoticeSubject } from '../util/noticeSentence';

describe('splitNoticeSubject', () => {
  test('splits a leading display name from the sentence once', () => {
    expect(
      splitNoticeSubject(
        'LimeTitanTV watched 20 consecutive streams',
        'LimeTitanTV',
      ),
    ).toEqual({
      lead: 'LimeTitanTV',
      rest: 'watched 20 consecutive streams',
    });
  });

  test('leaves the sentence whole when it does not start with the name', () => {
    expect(
      splitNoticeSubject(
        '500 raiders from RaidLeader have joined!',
        'RaidLeader',
      ),
    ).toEqual({
      lead: undefined,
      rest: '500 raiders from RaidLeader have joined!',
    });
  });

  test('treats a sentence that is only the name as a lead', () => {
    expect(splitNoticeSubject('Krankel', 'Krankel')).toEqual({
      lead: 'Krankel',
      rest: '',
    });
  });

  test('leaves the sentence whole when there is no display name', () => {
    expect(
      splitNoticeSubject('has been a moderator for 18 months!', ''),
    ).toEqual({
      lead: undefined,
      rest: 'has been a moderator for 18 months!',
    });
  });
});
