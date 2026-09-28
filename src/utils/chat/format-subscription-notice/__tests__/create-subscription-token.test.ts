import {
  createResubTags,
  createSubGiftTags,
  createSubscriptionTags,
} from '@app/types/chat/irc-tags/__fixtures__/user-notice-tags.fixture';
import type { MessageToken } from '@app/utils/chat/message-token';

import { createSubscriptionPart } from '../create-subscription-token';

describe('createSubscriptionPart', () => {
  test('createSubscriptionPart maps sub notices', () => {
    const token = createSubscriptionPart(
      createSubscriptionTags({
        'display-name': 'Viewer',
        'msg-param-sub-plan': '1000',
        'msg-param-cumulative-months': '3',
        'msg-param-streak-months': '1',
        'msg-param-should-share-streak': '0',
        'msg-param-sub-plan-name': 'Prime',
      }),
    );

    expect(token).toEqual<MessageToken<'sub'>>({
      type: 'sub',
      subscriptionEvent: {
        msgId: 'sub',
        displayName: 'Viewer',
        message: undefined,
        plan: '1000',
        planName: 'Tier 1',
        months: 3,
        streakMonths: 1,
        shouldShareStreak: false,
      },
    });
  });

  test('createSubscriptionPart maps resub notices with message text', () => {
    const token = createSubscriptionPart(
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

    expect(token).toEqual<MessageToken<'resub'>>({
      type: 'resub',
      subscriptionEvent: {
        msgId: 'resub',
        displayName: 'ResubUser',
        message: 'Still here!',
        plan: '3000',
        planName: 'Tier 3',
        months: 12,
        streakMonths: 4,
        shouldShareStreak: true,
      },
    });
  });

  test('createSubscriptionPart maps subgift notices', () => {
    const token = createSubscriptionPart(
      createSubGiftTags({
        'display-name': 'Gifter',
        'msg-param-recipient-display-name': 'Recipient',
        'msg-param-recipient-id': '123',
        'msg-param-recipient-user-name': 'recipient',
        'msg-param-gift-months': '1',
        'msg-param-months': '2',
      }),
    );

    expect(token).toEqual<MessageToken<'anongift'>>({
      type: 'anongift',
      subscriptionEvent: {
        msgId: 'subgift',
        displayName: 'Gifter',
        message: undefined,
        plan: '1000',
        planName: 'Tier 1',
        recipientDisplayName: 'Recipient',
        recipientId: '123',
        giftMonths: 1,
        months: 2,
      },
    });
  });

  test('createSubscriptionPart maps prime paid upgrade notices', () => {
    const token = createSubscriptionPart({
      'msg-id': 'primepaidupgrade',
      'display-name': 'Viewer',
      'msg-param-sub-plan': 'Prime',
      'msg-param-cumulative-months': '6',
    });

    expect(token).toEqual<MessageToken<'primepaidupgrade'>>({
      type: 'primepaidupgrade',
      subscriptionEvent: {
        msgId: 'primepaidupgrade',
        displayName: 'Viewer',
        message: undefined,
        plan: 'Prime',
        planName: 'Prime',
        months: 6,
      },
    });
  });

  test('falls back instead of rendering malformed numeric tags as NaN', () => {
    const token = createSubscriptionPart(
      createResubTags({
        'msg-param-cumulative-months': 'not-a-number',
        'msg-param-streak-months': 'also-not-a-number',
      }),
    );

    expect(token).toEqual<MessageToken<'resub'>>({
      type: 'resub',
      subscriptionEvent: {
        msgId: 'resub',
        displayName: 'ResubUser',
        message: undefined,
        plan: '1000',
        planName: 'Tier 1',
        months: 0,
        streakMonths: undefined,
        shouldShareStreak: false,
      },
    });
  });
});
