import type { ReactNode } from 'react';

import { Text } from '@app/components/ui/Text/Text';

import { subscriptionNoticeStyles as styles } from './SubscriptionNotice.styles';

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

export function buildSubscriptionNoticeDescription(
  input: SubscriptionDescriptionInput,
): ReactNode[] {
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
  const parts: ReactNode[] = [];

  switch (msgId) {
    case 'sub': {
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          {isPrime
            ? 'Subscribed with Prime.'
            : `Subscribed with ${tierDisplay}.`}
        </Text>,
      );
      break;
    }
    case 'resub': {
      const hasMonths = cumulativeMonths !== undefined && cumulativeMonths > 0;

      parts.push(
        <Text key='action' style={styles.descriptionText}>
          {isPrime
            ? 'Subscribed with Prime.'
            : `Subscribed with ${tierDisplay}.`}
        </Text>,
      );

      if (hasMonths) {
        parts.push(
          <Text key='months' style={styles.descriptionText}>
            {" They've subscribed for "}
          </Text>,
        );
        parts.push(
          <Text key='monthsCount' style={styles.monthsHighlight}>
            {`${cumulativeMonths} ${cumulativeMonths === 1 ? 'month' : 'months'}`}
          </Text>,
        );

        if (
          streakMonths !== undefined &&
          streakMonths > 0 &&
          shouldShareStreak
        ) {
          parts.push(
            <Text key='streak' style={styles.descriptionText}>
              {`, ${streakMonths} ${streakMonths === 1 ? 'month' : 'months'} in a row`}
            </Text>,
          );
        }

        parts.push(
          <Text key='period' style={styles.descriptionText}>
            .
          </Text>,
        );
      }
      break;
    }
    case 'subgift': {
      if (recipientDisplayName) {
        parts.push(
          <Text key='action' style={styles.descriptionText}>
            {`Gifted a ${tierDisplay} subscription to `}
          </Text>,
        );
        parts.push(
          <Text key='recipient' style={styles.recipientName}>
            {recipientDisplayName}
          </Text>,
        );
      } else {
        parts.push(
          <Text key='action' style={styles.descriptionText}>
            {`Gifted a ${tierDisplay} subscription`}
          </Text>,
        );
      }
      if (giftMonths !== undefined && giftMonths > 1) {
        parts.push(
          <Text key='giftMonths' style={styles.descriptionText}>
            {` (${giftMonths} months)`}
          </Text>,
        );
      }
      parts.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );
      break;
    }
    case 'anongiftpaidupgrade': {
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          Continuing their gift subscription
        </Text>,
      );
      if (promoName) {
        parts.push(
          <Text key='promo' style={styles.descriptionText}>
            {promoGiftTotal
              ? ` (${promoName}, ${promoGiftTotal} total)`
              : ` (${promoName})`}
          </Text>,
        );
      }
      parts.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );
      break;
    }
    case 'submysterygift': {
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          {'Gifted '}
        </Text>,
      );
      parts.push(
        <Text key='count' style={styles.monthsHighlight}>
          {massGiftCount ?? 0}
        </Text>,
      );
      parts.push(
        <Text key='tail' style={styles.descriptionText}>
          {` ${tierDisplay} ${
            (massGiftCount ?? 0) === 1 ? 'subscription' : 'subscriptions'
          } to the community`}
        </Text>,
      );

      if (senderCount !== undefined && senderCount > 0) {
        parts.push(
          <Text key='senderCount' style={styles.descriptionText}>
            {`. They've gifted ${senderCount} in the channel`}
          </Text>,
        );
      }

      parts.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );
      break;
    }
    case 'giftpaidupgrade': {
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          Continuing the gift sub
        </Text>,
      );

      if (senderName) {
        parts.push(
          <Text key='from' style={styles.descriptionText}>
            {' from '}
          </Text>,
        );

        parts.push(
          <Text key='sender' style={styles.recipientName}>
            {senderName}
          </Text>,
        );
      }

      if (promoName) {
        parts.push(
          <Text key='promo' style={styles.descriptionText}>
            {promoGiftTotal
              ? ` (${promoName}, ${promoGiftTotal} total)`
              : ` (${promoName})`}
          </Text>,
        );
      }

      parts.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );
      break;
    }
    case 'primepaidupgrade': {
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          {isPrime
            ? 'Upgraded their Prime subscription.'
            : `Upgraded their Prime subscription to ${tierDisplay}.`}
        </Text>,
      );
      break;
    }
    case 'extendsub': {
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          {isPrime
            ? 'Extended their subscription with Prime.'
            : `Extended their subscription with ${tierDisplay}.`}
        </Text>,
      );
      break;
    }
    case 'standardpayforward': {
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          Paid their subscription forward to another viewer.
        </Text>,
      );
      break;
    }
    case 'communitypayforward': {
      if (recipientDisplayName) {
        parts.push(
          <Text key='action' style={styles.descriptionText}>
            {'Paid their subscription forward to '}
          </Text>,
        );
        parts.push(
          <Text key='recipient' style={styles.recipientName}>
            {recipientDisplayName}
          </Text>,
        );
      } else {
        parts.push(
          <Text key='action' style={styles.descriptionText}>
            Paid their subscription forward to the community
          </Text>,
        );
      }
      parts.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );
      break;
    }
    case 'primecommunitygiftreceived': {
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          Received a Prime subscription from the community.
        </Text>,
      );
      break;
    }
    case 'anonsubgift': {
      if (recipientDisplayName) {
        parts.push(
          <Text key='action' style={styles.descriptionText}>
            {`An anonymous gifter gifted a ${tierDisplay} subscription to `}
          </Text>,
        );
        parts.push(
          <Text key='recipient' style={styles.recipientName}>
            {recipientDisplayName}
          </Text>,
        );
      } else {
        parts.push(
          <Text key='action' style={styles.descriptionText}>
            {`An anonymous gifter gifted a ${tierDisplay} subscription`}
          </Text>,
        );
      }
      parts.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );
      break;
    }
    case 'anonsubmysterygift': {
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          {'An anonymous gifter gifted '}
        </Text>,
      );
      parts.push(
        <Text key='count' style={styles.monthsHighlight}>
          {massGiftCount ?? 0}
        </Text>,
      );
      parts.push(
        <Text key='tail' style={styles.descriptionText}>
          {' '}
          {tierDisplay} subscription{massGiftCount === 1 ? '' : 's'} to the
          community
        </Text>,
      );
      parts.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );
      break;
    }
    default:
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          Subscription event.
        </Text>,
      );
  }

  return parts;
}
