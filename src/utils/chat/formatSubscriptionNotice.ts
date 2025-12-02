import {
  UserNoticeTags,
  ViewerMilestoneTags,
} from '@app/types/chat/irc-tags/usernotice';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

/**
 * Creates a subscription part from notice_tags
 */
export function createSubscriptionPart(
  tags: UserNoticeTags,
  messageText?: string,
): ParsedPart<'sub' | 'resub' | 'anongiftpaidupgrade' | 'anongift'> {
  const msgId = typeof tags['msg-id'] === 'string' ? tags['msg-id'] : '';
  const displayName =
    (typeof tags['display-name'] === 'string' ? tags['display-name'] : '') ||
    (typeof tags.login === 'string' ? tags.login : '') ||
    'Anonymous';

  const getPlanName = (planCode: string): string | undefined => {
    switch (planCode) {
      case '1000':
        return 'Prime';
      case '2000':
        return 'Tier 1';
      case '3000':
        return 'Tier 2';
      case '3001':
        return 'Tier 3';
      default:
        return undefined;
    }
  };

  switch (msgId) {
    case 'sub': {
      const plan =
        typeof tags['msg-param-sub-plan'] === 'string'
          ? tags['msg-param-sub-plan']
          : '';
      const cumulativeMonths = tags['msg-param-cumulative-months'];
      const months =
        typeof cumulativeMonths === 'string'
          ? parseInt(cumulativeMonths, 10)
          : undefined;
      const streakMonthsParam = tags['msg-param-streak-months'];
      const streakMonths =
        typeof streakMonthsParam === 'string'
          ? parseInt(streakMonthsParam, 10)
          : undefined;
      const shouldShareStreakParam = tags['msg-param-should-share-streak'];
      const shouldShareStreak =
        typeof shouldShareStreakParam === 'string'
          ? shouldShareStreakParam === '1'
          : undefined;

      return {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub' as const,
          displayName,
          message: messageText || undefined,
          plan,
          planName: getPlanName(plan),
          months,
          streakMonths,
          shouldShareStreak,
        },
      };
    }
    case 'resub': {
      const plan =
        typeof tags['msg-param-sub-plan'] === 'string'
          ? tags['msg-param-sub-plan']
          : '';
      const cumulativeMonths = tags['msg-param-cumulative-months'];
      const months =
        typeof cumulativeMonths === 'string'
          ? parseInt(cumulativeMonths, 10)
          : 0; // Default to 0 if not provided
      const streakMonthsParam = tags['msg-param-streak-months'];
      const streakMonths =
        typeof streakMonthsParam === 'string'
          ? parseInt(streakMonthsParam, 10)
          : undefined;
      const shouldShareStreakParam = tags['msg-param-should-share-streak'];
      const shouldShareStreak =
        typeof shouldShareStreakParam === 'string'
          ? shouldShareStreakParam === '1'
          : undefined;

      return {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub' as const,
          displayName,
          message: messageText || undefined,
          plan,
          planName: getPlanName(plan),
          months,
          streakMonths,
          shouldShareStreak,
        },
      };
    }
    case 'subgift': {
      const plan =
        typeof tags['msg-param-sub-plan'] === 'string'
          ? tags['msg-param-sub-plan']
          : '';
      const recipientDisplayName =
        typeof tags['msg-param-recipient-display-name'] === 'string'
          ? tags['msg-param-recipient-display-name']
          : '';
      const recipientId =
        typeof tags['msg-param-recipient-id'] === 'string'
          ? tags['msg-param-recipient-id']
          : '';
      const giftMonthsParam = tags['msg-param-gift-months'];
      const giftMonths =
        typeof giftMonthsParam === 'string' ? parseInt(giftMonthsParam, 10) : 0;
      const monthsParam = tags['msg-param-months'];
      const months =
        typeof monthsParam === 'string' ? parseInt(monthsParam, 10) : 0;

      return {
        type: 'anongift' as const,
        subscriptionEvent: {
          msgId: 'subgift' as const,
          displayName,
          message: messageText || undefined,
          plan,
          planName: getPlanName(plan),
          recipientDisplayName,
          recipientId,
          giftMonths,
          months,
        },
      };
    }
    case 'anongiftpaidupgrade': {
      const promoName =
        typeof tags['msg-param-promo-name'] === 'string'
          ? tags['msg-param-promo-name']
          : '';
      const promoGiftTotal =
        typeof tags['msg-param-promo-gift-total'] === 'string'
          ? tags['msg-param-promo-gift-total']
          : '';

      return {
        type: 'anongiftpaidupgrade' as const,
        subscriptionEvent: {
          msgId: 'anongiftpaidupgrade' as const,
          displayName,
          message: messageText || undefined,
          promoName,
          promoGiftTotal,
        },
      };
    }
    default: {
      const plan =
        typeof tags['msg-param-sub-plan'] === 'string'
          ? tags['msg-param-sub-plan']
          : '';
      const cumulativeMonths = tags['msg-param-cumulative-months'];
      const months =
        typeof cumulativeMonths === 'string'
          ? parseInt(cumulativeMonths, 10)
          : undefined;

      return {
        type: 'sub' as const,
        subscriptionEvent: {
          msgId: 'sub' as const,
          displayName,
          message: messageText || undefined,
          plan,
          planName: getPlanName(plan),
          months,
        },
      };
    }
  }
}

/**
 * Creates a viewermilestone part from notice_tags
 */
export function createViewerMilestonePart(
  tags: ViewerMilestoneTags,
  messageText?: string,
): ParsedPart<'viewermilestone'> {
  const category =
    typeof tags['msg-param-category'] === 'string'
      ? tags['msg-param-category']
      : '';
  const reward =
    typeof tags['msg-param-copoReward'] === 'string'
      ? tags['msg-param-copoReward']
      : '';
  const value =
    typeof tags['msg-param-value'] === 'string' ? tags['msg-param-value'] : '';
  const content = messageText || '';

  const systemMsg = tags['system-msg'] ?? '';
  const login = tags.login ?? '';
  const displayName = tags['display-name'] ?? '';

  // Construct the message based on category and value
  let constructedMessage = '';
  if (category === 'watch-streak' && displayName && value) {
    const streamCount = parseInt(value, 10);
    const streamText = streamCount === 1 ? 'stream' : 'streams';
    constructedMessage = `${displayName} watched ${value} consecutive ${streamText} and sparked a watch streak!`;
  } else if (systemMsg) {
    // Fallback to system-msg if we can't construct one
    constructedMessage = systemMsg;
  }

  return {
    type: 'viewermilestone',
    category,
    reward,
    value,
    content,
    systemMsg: constructedMessage || systemMsg,
    login,
    displayName,
  };
}
