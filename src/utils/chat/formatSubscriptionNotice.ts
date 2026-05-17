import {
  UserNoticeTags,
  ViewerMilestoneTags,
} from '@app/types/chat/irc-tags/usernotice';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

function getTagValue(
  tags: Record<string, string | boolean | undefined>,
  key: string,
): string {
  const value = tags[key];
  return typeof value === 'string' ? value : '';
}

function getTagNumber(
  tags: Record<string, string | boolean | undefined>,
  key: string,
  fallback?: number,
): number | undefined {
  const value = getTagValue(tags, key);
  return value ? parseInt(value, 10) : fallback;
}

function getSharedStreakValue(
  tags: Record<string, string | boolean | undefined>,
): boolean | undefined {
  const value = getTagValue(tags, 'msg-param-should-share-streak');
  return value ? value === '1' : undefined;
}

function getPlanName(planCode: string): string | undefined {
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
}

export function createSubscriptionPart(
  tags: UserNoticeTags,
  messageText?: string,
): ParsedPart<
  | 'sub'
  | 'resub'
  | 'anongiftpaidupgrade'
  | 'anongift'
  | 'submysterygift'
  | 'giftpaidupgrade'
> {
  const msgId = getTagValue(tags, 'msg-id');
  const displayName =
    getTagValue(tags, 'display-name') ||
    getTagValue(tags, 'login') ||
    'Anonymous';

  switch (msgId) {
    case 'sub': {
      const plan = getTagValue(tags, 'msg-param-sub-plan');
      const months = getTagNumber(tags, 'msg-param-cumulative-months');
      const streakMonths = getTagNumber(tags, 'msg-param-streak-months');
      const shouldShareStreak = getSharedStreakValue(tags);

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
      const plan = getTagValue(tags, 'msg-param-sub-plan');
      const months = getTagNumber(tags, 'msg-param-cumulative-months', 0) ?? 0;
      const streakMonths = getTagNumber(tags, 'msg-param-streak-months');
      const shouldShareStreak = getSharedStreakValue(tags);

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
      const plan = getTagValue(tags, 'msg-param-sub-plan');
      const recipientDisplayName = getTagValue(
        tags,
        'msg-param-recipient-display-name',
      );
      const recipientId = getTagValue(tags, 'msg-param-recipient-id');
      const giftMonths = getTagNumber(tags, 'msg-param-gift-months', 0) ?? 0;
      const months = getTagNumber(tags, 'msg-param-months', 0) ?? 0;

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
      const promoName = getTagValue(tags, 'msg-param-promo-name');
      const promoGiftTotal = getTagValue(tags, 'msg-param-promo-gift-total');

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
    case 'submysterygift': {
      const plan = getTagValue(tags, 'msg-param-sub-plan');

      return {
        type: 'submysterygift' as const,
        subscriptionEvent: {
          msgId: 'submysterygift' as const,
          displayName,
          message: messageText || undefined,
          plan,
          planName: getPlanName(plan),
          massGiftCount: getTagNumber(tags, 'msg-param-mass-gift-count'),
          senderCount: getTagNumber(tags, 'msg-param-sender-count'),
        },
      };
    }
    case 'giftpaidupgrade': {
      const senderLogin =
        getTagValue(tags, 'msg-param-sender-login') || undefined;
      const senderName =
        getTagValue(tags, 'msg-param-sender-name') || undefined;
      const promoName = getTagValue(tags, 'msg-param-promo-name') || undefined;
      const promoGiftTotal =
        getTagValue(tags, 'msg-param-promo-gift-total') || undefined;

      return {
        type: 'giftpaidupgrade' as const,
        subscriptionEvent: {
          msgId: 'giftpaidupgrade' as const,
          displayName,
          message: messageText || undefined,
          senderLogin,
          senderName,
          promoName,
          promoGiftTotal,
        },
      };
    }
    default: {
      const plan = getTagValue(tags, 'msg-param-sub-plan');
      const months = getTagNumber(tags, 'msg-param-cumulative-months');

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

export function createViewerMilestonePart(
  tags: ViewerMilestoneTags,
  messageText?: string,
): ParsedPart<'viewermilestone'> {
  const category = getTagValue(tags, 'msg-param-category');
  const reward = getTagValue(tags, 'msg-param-copoReward');
  const value = getTagValue(tags, 'msg-param-value');
  const content = messageText || '';

  const systemMsg = tags['system-msg'] ?? '';
  const login = tags.login ?? '';
  const displayName = tags['display-name'] ?? '';

  let constructedMessage = '';
  if (category === 'watch-streak' && displayName && value) {
    const streamCount = parseInt(value, 10);
    const streamText = streamCount === 1 ? 'stream' : 'streams';
    constructedMessage = `${displayName} watched ${value} consecutive ${streamText} and sparked a watch streak!`;
  } else if (systemMsg) {
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
