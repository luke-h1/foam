import type { MessageToken } from '@app/utils/chat/message-token';

import { getSubscriptionTierDisplay } from './subscription-notice-tier';

export type SubscriptionNoticeToken = MessageToken<
  | 'sub'
  | 'resub'
  | 'anongiftpaidupgrade'
  | 'anongift'
  | 'submysterygift'
  | 'giftpaidupgrade'
  | 'primepaidupgrade'
>;

export interface SubscriptionDescriptionInput {
  msgId: string;
  isPrime: boolean;
  tierDisplay: string;
  cumulativeMonths?: number;
  streakMonths?: number;
  shouldShareStreak?: boolean;
  recipientDisplayName?: string;
  giftMonths?: number;
  promoName?: string;
  promoGiftTotal?: number;
  massGiftCount?: number;
  senderCount?: number;
  senderName?: string;
}

/**
 * `description` is the plain sentence, `highlight` a count picked out in bold,
 * and `recipient` another user's name.
 */
export type SubscriptionNoticeSegmentTone =
  | 'description'
  | 'highlight'
  | 'recipient';

export interface SubscriptionNoticeSegment {
  key: string;
  text: string;
  tone: SubscriptionNoticeSegmentTone;
}

/**
 * Twitch's usernotice payload is a union: each subscription kind carries a
 * different subset of these fields, so each is read only when present.
 */
export function getSubscriptionDescriptionInput(
  subscriptionEvent: SubscriptionNoticeToken['subscriptionEvent'],
): SubscriptionDescriptionInput {
  const tierDisplay = getSubscriptionTierDisplay({
    plan: 'plan' in subscriptionEvent ? subscriptionEvent.plan : undefined,
    planName:
      'planName' in subscriptionEvent ? subscriptionEvent.planName : undefined,
  });

  return {
    msgId: subscriptionEvent.msgId,
    isPrime: tierDisplay === 'Prime',
    tierDisplay,
    cumulativeMonths:
      'months' in subscriptionEvent ? subscriptionEvent.months : undefined,
    streakMonths:
      'streakMonths' in subscriptionEvent
        ? subscriptionEvent.streakMonths
        : undefined,
    shouldShareStreak:
      'shouldShareStreak' in subscriptionEvent
        ? subscriptionEvent.shouldShareStreak
        : undefined,
    giftMonths:
      'giftMonths' in subscriptionEvent
        ? subscriptionEvent.giftMonths
        : undefined,
    recipientDisplayName:
      'recipientDisplayName' in subscriptionEvent
        ? subscriptionEvent.recipientDisplayName
        : undefined,
    promoName:
      'promoName' in subscriptionEvent
        ? subscriptionEvent.promoName
        : undefined,
    promoGiftTotal:
      'promoGiftTotal' in subscriptionEvent
        ? Number(subscriptionEvent.promoGiftTotal) || undefined
        : undefined,
    massGiftCount:
      'massGiftCount' in subscriptionEvent
        ? subscriptionEvent.massGiftCount
        : undefined,
    senderCount:
      'senderCount' in subscriptionEvent
        ? subscriptionEvent.senderCount
        : undefined,
    senderName:
      'senderName' in subscriptionEvent
        ? subscriptionEvent.senderName
        : undefined,
  };
}

function plain(key: string, text: string): SubscriptionNoticeSegment {
  return { key, text, tone: 'description' };
}

function recipient(key: string, text: string): SubscriptionNoticeSegment {
  return { key, text, tone: 'recipient' };
}

function subscribedWith({
  isPrime,
  tierDisplay,
}: SubscriptionDescriptionInput): SubscriptionNoticeSegment {
  return plain(
    'action',
    isPrime ? 'Subscribed with Prime.' : `Subscribed with ${tierDisplay}.`,
  );
}

function promoSuffix({
  promoName,
  promoGiftTotal,
}: SubscriptionDescriptionInput): SubscriptionNoticeSegment[] {
  if (!promoName) {
    return [];
  }

  return [
    plain(
      'promo',
      promoGiftTotal
        ? ` (${promoName}, ${promoGiftTotal} total)`
        : ` (${promoName})`,
    ),
  ];
}

/**
 * Adds ", N months in a row" after the cumulative months, but only when the
 * subscriber chose to share their streak.
 */
function streakSuffix({
  shouldShareStreak,
  streakMonths,
}: SubscriptionDescriptionInput): SubscriptionNoticeSegment[] {
  if (streakMonths === undefined || streakMonths <= 0 || !shouldShareStreak) {
    return [];
  }

  return [
    plain(
      'streak',
      `, ${streakMonths} ${streakMonths === 1 ? 'month' : 'months'} in a row`,
    ),
  ];
}

function resubSegments(
  input: SubscriptionDescriptionInput,
): SubscriptionNoticeSegment[] {
  const { cumulativeMonths } = input;

  if (cumulativeMonths === undefined || cumulativeMonths <= 0) {
    return [subscribedWith(input)];
  }

  return [
    subscribedWith(input),
    plain('months', " They've subscribed for "),
    {
      key: 'monthsCount',
      text: `${cumulativeMonths} ${cumulativeMonths === 1 ? 'month' : 'months'}`,
      tone: 'highlight',
    },
    ...streakSuffix(input),
    plain('period', '.'),
  ];
}

function giftToSegments(
  lead: string,
  recipientDisplayName: string | undefined,
): SubscriptionNoticeSegment[] {
  if (!recipientDisplayName) {
    return [plain('action', lead)];
  }

  return [
    plain('action', `${lead} to `),
    recipient('recipient', recipientDisplayName),
  ];
}

function subGiftSegments({
  giftMonths,
  recipientDisplayName,
  tierDisplay,
}: SubscriptionDescriptionInput): SubscriptionNoticeSegment[] {
  return [
    ...giftToSegments(
      `Gifted a ${tierDisplay} subscription`,
      recipientDisplayName,
    ),
    ...(giftMonths !== undefined && giftMonths > 1
      ? [plain('giftMonths', ` (${giftMonths} months)`)]
      : []),
    plain('period', '.'),
  ];
}

function mysteryGiftSegments({
  massGiftCount,
  senderCount,
  tierDisplay,
}: SubscriptionDescriptionInput): SubscriptionNoticeSegment[] {
  const count = massGiftCount ?? 0;

  return [
    plain('action', 'Gifted '),
    { key: 'count', text: String(count), tone: 'highlight' },
    plain(
      'tail',
      ` ${tierDisplay} ${count === 1 ? 'subscription' : 'subscriptions'} to the community`,
    ),
    ...(senderCount !== undefined && senderCount > 0
      ? [plain('senderCount', `. They've gifted ${senderCount} in the channel`)]
      : []),
    plain('period', '.'),
  ];
}

function giftPaidUpgradeSegments(
  input: SubscriptionDescriptionInput,
): SubscriptionNoticeSegment[] {
  const { senderName } = input;

  return [
    plain('action', 'Continuing the gift sub'),
    ...(senderName
      ? [plain('from', ' from '), recipient('sender', senderName)]
      : []),
    ...promoSuffix(input),
    plain('period', '.'),
  ];
}

function anonMysteryGiftSegments({
  massGiftCount,
  tierDisplay,
}: SubscriptionDescriptionInput): SubscriptionNoticeSegment[] {
  return [
    plain('action', 'An anonymous gifter gifted '),
    { key: 'count', text: String(massGiftCount ?? 0), tone: 'highlight' },
    plain(
      'tail',
      ` ${tierDisplay} subscription${massGiftCount === 1 ? '' : 's'} to the community`,
    ),
    plain('period', '.'),
  ];
}

/**
 * The sentence after the subscriber's name, one segment per styled run.
 */
export function getSubscriptionNoticeSegments(
  input: SubscriptionDescriptionInput,
): SubscriptionNoticeSegment[] {
  const { isPrime, recipientDisplayName, tierDisplay } = input;

  switch (input.msgId) {
    case 'sub':
      return [subscribedWith(input)];

    case 'resub':
      return resubSegments(input);

    case 'subgift':
      return subGiftSegments(input);

    case 'anongiftpaidupgrade':
      return [
        plain('action', 'Continuing their gift subscription'),
        ...promoSuffix(input),
        plain('period', '.'),
      ];

    case 'submysterygift':
      return mysteryGiftSegments(input);

    case 'giftpaidupgrade':
      return giftPaidUpgradeSegments(input);

    case 'primepaidupgrade':
      return [
        plain(
          'action',
          isPrime
            ? 'Upgraded their Prime subscription.'
            : `Upgraded their Prime subscription to ${tierDisplay}.`,
        ),
      ];

    case 'extendsub':
      return [
        plain(
          'action',
          isPrime
            ? 'Extended their subscription with Prime.'
            : `Extended their subscription with ${tierDisplay}.`,
        ),
      ];

    case 'standardpayforward':
      return [
        plain('action', 'Paid their subscription forward to another viewer.'),
      ];

    case 'communitypayforward':
      return [
        ...giftToSegments(
          recipientDisplayName
            ? 'Paid their subscription forward'
            : 'Paid their subscription forward to the community',
          recipientDisplayName,
        ),
        plain('period', '.'),
      ];

    case 'primecommunitygiftreceived':
      return [
        plain('action', 'Received a Prime subscription from the community.'),
      ];

    case 'anonsubgift':
      return [
        ...giftToSegments(
          `An anonymous gifter gifted a ${tierDisplay} subscription`,
          recipientDisplayName,
        ),
        plain('period', '.'),
      ];

    case 'anonsubmysterygift':
      return anonMysteryGiftSegments(input);

    default:
      return [plain('action', 'Subscription event.')];
  }
}
