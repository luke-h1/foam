import {
  UserNoticeTags,
  ViewerMilestoneTags,
} from '@app/types/chat/irc-tags/usernotice';
import { formatCharityAmount } from '@app/utils/chat/formatCharityAmount';
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
  | 'primepaidupgrade'
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
    case 'anonsubgift': {
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
          msgId: 'anonsubgift' as const,
          displayName: 'Anonymous',
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
    case 'anonsubmysterygift': {
      const plan = getTagValue(tags, 'msg-param-sub-plan');

      return {
        type: 'submysterygift' as const,
        subscriptionEvent: {
          msgId: 'anonsubmysterygift' as const,
          displayName: 'Anonymous',
          message: messageText || undefined,
          plan,
          planName: getPlanName(plan),
          massGiftCount: getTagNumber(tags, 'msg-param-mass-gift-count'),
          senderCount: getTagNumber(tags, 'msg-param-sender-count'),
        },
      };
    }
    case 'primepaidupgrade': {
      const plan = getTagValue(tags, 'msg-param-sub-plan');
      const months = getTagNumber(tags, 'msg-param-cumulative-months');

      return {
        type: 'primepaidupgrade' as const,
        subscriptionEvent: {
          msgId: 'primepaidupgrade' as const,
          displayName,
          message: messageText || undefined,
          plan,
          planName: getPlanName(plan),
          months,
        },
      };
    }
    case 'extendsub': {
      const plan = getTagValue(tags, 'msg-param-sub-plan');
      const months = getTagNumber(tags, 'msg-param-cumulative-months', 0) ?? 0;
      const streakMonths = getTagNumber(tags, 'msg-param-streak-months');
      const shouldShareStreak = getSharedStreakValue(tags);

      return {
        type: 'resub' as const,
        subscriptionEvent: {
          msgId: 'extendsub' as const,
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
    case 'standardpayforward': {
      const plan = getTagValue(tags, 'msg-param-sub-plan');

      return {
        type: 'resub' as const,
        subscriptionEvent: {
          msgId: 'standardpayforward' as const,
          displayName,
          message: messageText || undefined,
          plan,
          planName: getPlanName(plan),
          months: 1,
        },
      };
    }
    case 'communitypayforward': {
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
          msgId: 'communitypayforward' as const,
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
    case 'primecommunitygiftreceived': {
      const plan = getTagValue(tags, 'msg-param-sub-plan');
      const recipientDisplayName =
        getTagValue(tags, 'display-name') || displayName;
      const recipientId = getTagValue(tags, 'user-id');
      const giftMonths = getTagNumber(tags, 'msg-param-gift-months', 0) ?? 0;
      const months = getTagNumber(tags, 'msg-param-months', 0) ?? 0;
      const senderName = getTagValue(tags, 'msg-param-sender-name') || 'Prime';

      return {
        type: 'anongift' as const,
        subscriptionEvent: {
          msgId: 'primecommunitygiftreceived' as const,
          displayName: senderName,
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

export function createCharityDonationPart(
  tags: UserNoticeTags,
  messageText?: string,
): ParsedPart<'charitydonation'> {
  const currency = getTagValue(tags, 'msg-param-donation-currency') || 'USD';
  const systemMsg =
    typeof tags['system-msg'] === 'string' ? tags['system-msg'] : '';

  return {
    type: 'charitydonation',
    displayName:
      getTagValue(tags, 'display-name') || getTagValue(tags, 'login') || '',
    charityName: getTagValue(tags, 'msg-param-charity-name') || 'charity',
    amount: formatCharityAmount(
      getTagValue(tags, 'msg-param-donation-amount'),
      getTagValue(tags, 'msg-param-exponent'),
      currency,
    ),
    currency,
    systemMsg,
    message: messageText || undefined,
  };
}

export function createRitualPart(
  tags: UserNoticeTags,
  messageText?: string,
): ParsedPart<'ritual'> {
  const systemMsg =
    typeof tags['system-msg'] === 'string' ? tags['system-msg'] : '';

  return {
    type: 'ritual',
    displayName:
      getTagValue(tags, 'display-name') || getTagValue(tags, 'login') || '',
    ritualName: getTagValue(tags, 'msg-param-ritual-name'),
    systemMsg,
    message: messageText || undefined,
  };
}
