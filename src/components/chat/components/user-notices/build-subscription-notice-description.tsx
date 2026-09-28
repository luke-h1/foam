import type { ReactNode } from 'react';

import { subscriptionNoticeStyles as styles } from '@app/components/chat/components/user-notices/subscription-notice.styles';
import { Text } from '@app/components/ui/text/text';

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
 * Adds ", N months in a row" after the cumulative months, but only when the
 * subscriber chose to share their streak.
 */
function pushStreakPart({
  tokens,
  shouldShareStreak,
  streakMonths,
}: {
  tokens: ReactNode[];
  shouldShareStreak: boolean | undefined;
  streakMonths: number | undefined;
}): void {
  if (streakMonths === undefined || streakMonths <= 0 || !shouldShareStreak) {
    return;
  }

  tokens.push(
    <Text key='streak' style={styles.descriptionText}>
      {`, ${streakMonths} ${streakMonths === 1 ? 'month' : 'months'} in a row`}
    </Text>,
  );
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

  const tokens: ReactNode[] = [];

  switch (msgId) {
    case 'sub': {
      tokens.push(
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

      tokens.push(
        <Text key='action' style={styles.descriptionText}>
          {isPrime
            ? 'Subscribed with Prime.'
            : `Subscribed with ${tierDisplay}.`}
        </Text>,
      );

      if (hasMonths) {
        tokens.push(
          <Text key='months' style={styles.descriptionText}>
            {" They've subscribed for "}
          </Text>,
        );

        tokens.push(
          <Text key='monthsCount' style={styles.monthsHighlight}>
            {`${cumulativeMonths} ${cumulativeMonths === 1 ? 'month' : 'months'}`}
          </Text>,
        );

        pushStreakPart({
          tokens,
          shouldShareStreak,
          streakMonths,
        });

        tokens.push(
          <Text key='period' style={styles.descriptionText}>
            .
          </Text>,
        );
      }

      break;
    }
    case 'subgift': {
      if (recipientDisplayName) {
        tokens.push(
          <Text key='action' style={styles.descriptionText}>
            {`Gifted a ${tierDisplay} subscription to `}
          </Text>,
        );

        tokens.push(
          <Text key='recipient' style={styles.recipientName}>
            {recipientDisplayName}
          </Text>,
        );
      } else {
        tokens.push(
          <Text key='action' style={styles.descriptionText}>
            {`Gifted a ${tierDisplay} subscription`}
          </Text>,
        );
      }

      if (giftMonths !== undefined && giftMonths > 1) {
        tokens.push(
          <Text key='giftMonths' style={styles.descriptionText}>
            {` (${giftMonths} months)`}
          </Text>,
        );
      }

      tokens.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );

      break;
    }
    case 'anongiftpaidupgrade': {
      tokens.push(
        <Text key='action' style={styles.descriptionText}>
          Continuing their gift subscription
        </Text>,
      );

      if (promoName) {
        tokens.push(
          <Text key='promo' style={styles.descriptionText}>
            {promoGiftTotal
              ? ` (${promoName}, ${promoGiftTotal} total)`
              : ` (${promoName})`}
          </Text>,
        );
      }

      tokens.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );

      break;
    }
    case 'submysterygift': {
      tokens.push(
        <Text key='action' style={styles.descriptionText}>
          {'Gifted '}
        </Text>,
      );

      tokens.push(
        <Text key='count' style={styles.monthsHighlight}>
          {massGiftCount ?? 0}
        </Text>,
      );

      tokens.push(
        <Text key='tail' style={styles.descriptionText}>
          {` ${tierDisplay} ${
            (massGiftCount ?? 0) === 1 ? 'subscription' : 'subscriptions'
          } to the community`}
        </Text>,
      );

      if (senderCount !== undefined && senderCount > 0) {
        tokens.push(
          <Text key='senderCount' style={styles.descriptionText}>
            {`. They've gifted ${senderCount} in the channel`}
          </Text>,
        );
      }

      tokens.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );

      break;
    }
    case 'giftpaidupgrade': {
      tokens.push(
        <Text key='action' style={styles.descriptionText}>
          Continuing the gift sub
        </Text>,
      );

      if (senderName) {
        tokens.push(
          <Text key='from' style={styles.descriptionText}>
            {' from '}
          </Text>,
        );

        tokens.push(
          <Text key='sender' style={styles.recipientName}>
            {senderName}
          </Text>,
        );
      }

      if (promoName) {
        tokens.push(
          <Text key='promo' style={styles.descriptionText}>
            {promoGiftTotal
              ? ` (${promoName}, ${promoGiftTotal} total)`
              : ` (${promoName})`}
          </Text>,
        );
      }

      tokens.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );

      break;
    }
    case 'primepaidupgrade': {
      tokens.push(
        <Text key='action' style={styles.descriptionText}>
          {isPrime
            ? 'Upgraded their Prime subscription.'
            : `Upgraded their Prime subscription to ${tierDisplay}.`}
        </Text>,
      );

      break;
    }
    case 'extendsub': {
      tokens.push(
        <Text key='action' style={styles.descriptionText}>
          {isPrime
            ? 'Extended their subscription with Prime.'
            : `Extended their subscription with ${tierDisplay}.`}
        </Text>,
      );

      break;
    }
    case 'standardpayforward': {
      tokens.push(
        <Text key='action' style={styles.descriptionText}>
          Paid their subscription forward to another viewer.
        </Text>,
      );
      break;
    }
    case 'communitypayforward': {
      if (recipientDisplayName) {
        tokens.push(
          <Text key='action' style={styles.descriptionText}>
            {'Paid their subscription forward to '}
          </Text>,
        );

        tokens.push(
          <Text key='recipient' style={styles.recipientName}>
            {recipientDisplayName}
          </Text>,
        );
      } else {
        tokens.push(
          <Text key='action' style={styles.descriptionText}>
            Paid their subscription forward to the community
          </Text>,
        );
      }

      tokens.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );

      break;
    }
    case 'primecommunitygiftreceived': {
      tokens.push(
        <Text key='action' style={styles.descriptionText}>
          Received a Prime subscription from the community.
        </Text>,
      );
      break;
    }
    case 'anonsubgift': {
      if (recipientDisplayName) {
        tokens.push(
          <Text key='action' style={styles.descriptionText}>
            {`An anonymous gifter gifted a ${tierDisplay} subscription to `}
          </Text>,
        );

        tokens.push(
          <Text key='recipient' style={styles.recipientName}>
            {recipientDisplayName}
          </Text>,
        );
      } else {
        tokens.push(
          <Text key='action' style={styles.descriptionText}>
            {`An anonymous gifter gifted a ${tierDisplay} subscription`}
          </Text>,
        );
      }

      tokens.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );

      break;
    }
    case 'anonsubmysterygift': {
      tokens.push(
        <Text key='action' style={styles.descriptionText}>
          {'An anonymous gifter gifted '}
        </Text>,
      );

      tokens.push(
        <Text key='count' style={styles.monthsHighlight}>
          {massGiftCount ?? 0}
        </Text>,
      );

      tokens.push(
        <Text key='tail' style={styles.descriptionText}>
          {' '}
          {tierDisplay} subscription{massGiftCount === 1 ? '' : 's'} to the
          community
        </Text>,
      );

      tokens.push(
        <Text key='period' style={styles.descriptionText}>
          .
        </Text>,
      );

      break;
    }
    default:
      tokens.push(
        <Text key='action' style={styles.descriptionText}>
          Subscription event.
        </Text>,
      );
  }

  return tokens;
}
