import {
  createResubTags,
  createSubGiftTags,
  createSubscriptionTags,
  createViewerMilestoneTags,
} from '@app/types/chat/irc-tags/__fixtures__/userNoticeTags.fixture';
import {
  createCharityDonationPart,
  createRitualPart,
  createSubscriptionPart,
  createViewerMilestonePart,
} from '../formatSubscriptionNotice';

describe('formatSubscriptionNotice', () => {
  test('createSubscriptionPart maps sub notices', () => {
    const part = createSubscriptionPart(
      createSubscriptionTags({
        'display-name': 'Viewer',
        'msg-param-sub-plan': '1000',
        'msg-param-cumulative-months': '3',
        'msg-param-streak-months': '1',
        'msg-param-should-share-streak': '0',
        'msg-param-sub-plan-name': 'Prime',
      }),
    );

    expect(part.type).toBe('sub');
    expect(part.subscriptionEvent).toMatchObject({
      msgId: 'sub',
      displayName: 'Viewer',
      plan: '1000',
      planName: 'Prime',
      months: 3,
    });
  });

  test('createSubscriptionPart maps resub notices with message text', () => {
    const part = createSubscriptionPart(
      createResubTags({
        login: 'viewer',
        'msg-param-sub-plan': '3000',
        'msg-param-cumulative-months': '12',
        'msg-param-streak-months': '4',
        'msg-param-should-share-streak': '1',
        'msg-param-sub-plan-name': 'Tier 2',
      }),
      'Still here!',
    );

    expect(part.type).toBe('resub');
    expect(part.subscriptionEvent).toMatchObject({
      msgId: 'resub',
      displayName: 'viewer',
      message: 'Still here!',
      plan: '3000',
      planName: 'Tier 2',
      months: 12,
      streakMonths: 4,
      shouldShareStreak: true,
    });
  });

  test('createViewerMilestonePart builds watch streak copy', () => {
    const part = createViewerMilestonePart(
      createViewerMilestoneTags({
        'display-name': 'Viewer',
        'msg-param-value': '10',
        'msg-param-copoReward': '',
      }),
    );

    expect(part.type).toBe('viewermilestone');
    expect(part.systemMsg).toBe(
      'Viewer watched 10 consecutive streams and sparked a watch streak!',
    );
  });

  test('createCharityDonationPart maps charity donation notices', () => {
    const part = createCharityDonationPart({
      'msg-id': 'charitydonation',
      'display-name': 'Donor',
      'msg-param-charity-name': 'Example Charity',
      'msg-param-donation-amount': '2500',
      'msg-param-exponent': '2',
      'msg-param-donation-currency': 'USD',
    });

    expect(part.type).toBe('charitydonation');
    expect(part).toMatchObject({
      displayName: 'Donor',
      charityName: 'Example Charity',
      amount: '$25.00',
      currency: 'USD',
    });
  });

  test('createRitualPart maps ritual notices', () => {
    const part = createRitualPart({
      'msg-id': 'ritual',
      'display-name': 'Viewer',
      'msg-param-ritual-name': 'new_chatter',
    });

    expect(part.type).toBe('ritual');
    expect(part).toMatchObject({
      displayName: 'Viewer',
      ritualName: 'new_chatter',
    });
  });

  test('createSubscriptionPart maps subgift notices', () => {
    const part = createSubscriptionPart(
      createSubGiftTags({
        'display-name': 'Gifter',
        'msg-param-recipient-display-name': 'Recipient',
        'msg-param-recipient-id': '123',
        'msg-param-recipient-user-name': 'recipient',
        'msg-param-gift-months': '1',
        'msg-param-months': '2',
      }),
    );

    expect(part.type).toBe('anongift');
    expect(part.subscriptionEvent).toMatchObject({
      msgId: 'subgift',
      displayName: 'Gifter',
      planName: 'Tier 1',
      recipientDisplayName: 'Recipient',
      recipientId: '123',
      giftMonths: 1,
      months: 2,
    });
  });

  test('createSubscriptionPart maps prime paid upgrade notices', () => {
    const part = createSubscriptionPart({
      'msg-id': 'primepaidupgrade',
      'display-name': 'Viewer',
      'msg-param-sub-plan': '1000',
      'msg-param-cumulative-months': '6',
    });

    expect(part.type).toBe('primepaidupgrade');
    expect(part.subscriptionEvent).toMatchObject({
      msgId: 'primepaidupgrade',
      displayName: 'Viewer',
      planName: 'Prime',
      months: 6,
    });
  });
});
