import type { ReactNode } from 'react';
import {
  SubscriptionDescriptionHighlight as Highlight,
  SubscriptionDescriptionRecipient as Recipient,
  SubscriptionDescriptionText as Description,
} from './subscriptionNoticeDescriptionParts';

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

function formatMonthCount(count: number): string {
  return `${count} month${count > 1 ? 's' : ''}`;
}

function formatTierSuffix(isPrime: boolean, tierDisplay: string): string {
  return isPrime ? ' with Prime' : ` with ${tierDisplay}`;
}

function formatPromoSuffix(
  promoName?: string,
  promoGiftTotal?: number,
): string {
  if (!promoName) {
    return '';
  }

  const total = promoGiftTotal ? `, ${promoGiftTotal} total` : '';
  return ` (${promoName}${total})`;
}

function buildGiftSubscriptionDescription({
  tierDisplay,
  recipientDisplayName,
  giftMonths,
  prefix = '',
}: {
  tierDisplay: string;
  recipientDisplayName?: string;
  giftMonths?: number;
  prefix?: string;
}): ReactNode {
  const giftMonthsSuffix =
    giftMonths !== undefined && giftMonths > 1
      ? ` (${formatMonthCount(giftMonths)})`
      : '';

  if (recipientDisplayName) {
    return (
      <Description>
        {prefix}Gifted a {tierDisplay} subscription to{' '}
        <Recipient>{recipientDisplayName}</Recipient>
        {giftMonthsSuffix}.
      </Description>
    );
  }

  return (
    <Description>
      {prefix}Gifted a {tierDisplay} subscription{giftMonthsSuffix}.
    </Description>
  );
}

function buildMassGiftDescription({
  tierDisplay,
  massGiftCount,
  senderCount,
  prefix = '',
}: {
  tierDisplay: string;
  massGiftCount?: number;
  senderCount?: number;
  prefix?: string;
}): ReactNode {
  const count = massGiftCount ?? 0;
  const subscriptionWord = count === 1 ? 'subscription' : 'subscriptions';
  const senderSuffix =
    senderCount !== undefined && senderCount > 0
      ? `. They've gifted ${senderCount} in the channel`
      : '';

  return (
    <Description>
      {prefix}Gifted <Highlight>{count}</Highlight> {tierDisplay}{' '}
      {subscriptionWord} to the community{senderSuffix}.
    </Description>
  );
}

function buildPayForwardDescription(recipientDisplayName?: string): ReactNode {
  if (recipientDisplayName) {
    return (
      <Description>
        Paid their subscription forward to{' '}
        <Recipient>{recipientDisplayName}</Recipient>.
      </Description>
    );
  }

  return (
    <Description>Paid their subscription forward to the community.</Description>
  );
}

function buildContinuingGiftDescription({
  base,
  senderName,
  promoName,
  promoGiftTotal,
}: {
  base: string;
  senderName?: string;
  promoName?: string;
  promoGiftTotal?: number;
}): ReactNode {
  return (
    <Description>
      {base}
      {senderName ? (
        <>
          {' from '}
          <Recipient>{senderName}</Recipient>
        </>
      ) : null}
      {formatPromoSuffix(promoName, promoGiftTotal)}.
    </Description>
  );
}

export function buildSubscriptionNoticeDescription(
  input: SubscriptionDescriptionInput,
): ReactNode {
  const {
    msgId,
    isPrime,
    tierDisplay,
    cumulativeMonths,
    streakMonths,
    shouldShareStreak,
    recipientDisplayName,
    giftMonths,
    promoName,
    promoGiftTotal,
    massGiftCount,
    senderCount,
    senderName,
  } = input;

  const tierSuffix = formatTierSuffix(isPrime, tierDisplay);

  switch (msgId) {
    case 'sub':
      return <Description>Subscribed{tierSuffix}.</Description>;

    case 'resub': {
      const hasMonths = cumulativeMonths !== undefined && cumulativeMonths > 0;
      const showStreak =
        hasMonths &&
        streakMonths !== undefined &&
        streakMonths > 0 &&
        shouldShareStreak;

      if (!hasMonths) {
        return <Description>Subscribed{tierSuffix}.</Description>;
      }

      return (
        <Description>
          Subscribed{tierSuffix}. They&apos;ve subscribed for{' '}
          <Highlight>{formatMonthCount(cumulativeMonths)}</Highlight>
          {showStreak ? `, ${formatMonthCount(streakMonths)} in a row` : ''}.
        </Description>
      );
    }

    case 'subgift':
      return buildGiftSubscriptionDescription({
        tierDisplay,
        recipientDisplayName,
        giftMonths,
      });

    case 'anongiftpaidupgrade':
      return (
        <Description>
          Continuing their gift subscription
          {formatPromoSuffix(promoName, promoGiftTotal)}.
        </Description>
      );

    case 'submysterygift':
      return buildMassGiftDescription({
        tierDisplay,
        massGiftCount,
        senderCount,
      });

    case 'giftpaidupgrade':
      return buildContinuingGiftDescription({
        base: 'Continuing the gift sub',
        senderName,
        promoName,
        promoGiftTotal,
      });

    case 'primepaidupgrade':
      return (
        <Description>
          Upgraded their Prime subscription
          {isPrime ? '' : ` to ${tierDisplay}`}.
        </Description>
      );

    case 'extendsub':
      return (
        <Description>Extended their subscription{tierSuffix}.</Description>
      );

    case 'standardpayforward':
      return (
        <Description>
          Paid their subscription forward to another viewer.
        </Description>
      );

    case 'communitypayforward':
      return buildPayForwardDescription(recipientDisplayName);

    case 'primecommunitygiftreceived':
      return (
        <Description>
          Received a Prime subscription from the community.
        </Description>
      );

    case 'anonsubgift':
      return buildGiftSubscriptionDescription({
        tierDisplay,
        recipientDisplayName,
        prefix: 'An anonymous gifter ',
      });

    case 'anonsubmysterygift':
      return buildMassGiftDescription({
        tierDisplay,
        massGiftCount,
        prefix: 'An anonymous gifter ',
      });

    default:
      return <Description>Subscription event.</Description>;
  }
}
