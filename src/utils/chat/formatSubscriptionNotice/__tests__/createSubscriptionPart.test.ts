import {
  createResubTags,
  createSubGiftTags,
  createSubscriptionTags,
} from '@app/types/chat/irc-tags/__fixtures__/userNoticeTags.fixture';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { createSubscriptionPart } from '../createSubscriptionPart';

describe('createSubscriptionPart', () => {
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

    expect(part).toEqual<ParsedPart<'sub'>>({
      type: 'sub',
      subscriptionEvent: {
        msgId: 'sub',
        displayName: 'Viewer',
        message: undefined,
        plan: '1000',
        planName: 'Prime',
        months: 3,
        streakMonths: 1,
        shouldShareStreak: false,
      },
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

    expect(part).toEqual<ParsedPart<'resub'>>({
      type: 'resub',
      subscriptionEvent: {
        msgId: 'resub',
        displayName: 'ResubUser',
        message: 'Still here!',
        plan: '3000',
        planName: 'Tier 2',
        months: 12,
        streakMonths: 4,
        shouldShareStreak: true,
      },
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

    expect(part).toEqual<ParsedPart<'anongift'>>({
      type: 'anongift',
      subscriptionEvent: {
        msgId: 'subgift',
        displayName: 'Gifter',
        message: undefined,
        plan: '2000',
        planName: 'Tier 1',
        recipientDisplayName: 'Recipient',
        recipientId: '123',
        giftMonths: 1,
        months: 2,
      },
    });
  });

  test('createSubscriptionPart maps prime paid upgrade notices', () => {
    const part = createSubscriptionPart({
      'msg-id': 'primepaidupgrade',
      'display-name': 'Viewer',
      'msg-param-sub-plan': '1000',
      'msg-param-cumulative-months': '6',
    });

    expect(part).toEqual<ParsedPart<'primepaidupgrade'>>({
      type: 'primepaidupgrade',
      subscriptionEvent: {
        msgId: 'primepaidupgrade',
        displayName: 'Viewer',
        message: undefined,
        plan: '1000',
        planName: 'Prime',
        months: 6,
      },
    });
  });
});
