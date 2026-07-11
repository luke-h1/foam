import { isSubscriptionUserNotice } from '../isSubscriptionUserNotice';

describe('isSubscriptionUserNotice', () => {
  test.each([
    'sub',
    'resub',
    'subgift',
    'anonsubgift',
    'submysterygift',
    'anonsubmysterygift',
    'giftpaidupgrade',
    'anongiftpaidupgrade',
    'primepaidupgrade',
    'extendsub',
    'standardpayforward',
    'communitypayforward',
    'primecommunitygiftreceived',
  ])('treats %s as a subscription notice', msgId => {
    expect(isSubscriptionUserNotice(msgId)).toBe(true);
  });

  test.each(['raid', 'announcement', 'ritual', 'unknown', ''])(
    'does not treat %s as a subscription notice',
    msgId => {
      expect(isSubscriptionUserNotice(msgId)).toBe(false);
    },
  );

  test('returns false for an undefined msg id', () => {
    expect(isSubscriptionUserNotice(undefined)).toBe(false);
  });
});
