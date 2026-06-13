import { Text } from '@app/components/ui/Text/Text';
import type { ReactNode } from 'react';
import { subscriptionNoticeStyles as styles } from './subscriptionNoticeStyles';
import i18next from '@app/i18n/i18next';

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
            ? i18next.t('chat:subNotice.subscribedWithPrime')
            : i18next.t('chat:subNotice.subscribedWithTier', {
                tier: tierDisplay,
              })}
        </Text>,
      );
      break;
    }
    case 'resub': {
      const hasMonths = cumulativeMonths !== undefined && cumulativeMonths > 0;

      parts.push(
        <Text key='action' style={styles.descriptionText}>
          {isPrime
            ? i18next.t('chat:subNotice.subscribedWithPrime')
            : i18next.t('chat:subNotice.subscribedWithTier', {
                tier: tierDisplay,
              })}
        </Text>,
      );

      if (hasMonths) {
        parts.push(
          <Text key='months' style={styles.descriptionText}>
            {i18next.t('chat:subNotice.subscribedFor')}
          </Text>,
        );
        parts.push(
          <Text key='monthsCount' style={styles.monthsHighlight}>
            {i18next.t('chat:subNotice.months', { count: cumulativeMonths })}
          </Text>,
        );

        if (
          streakMonths !== undefined &&
          streakMonths > 0 &&
          shouldShareStreak
        ) {
          parts.push(
            <Text key='streak' style={styles.descriptionText}>
              {i18next.t('chat:subNotice.streak', { count: streakMonths })}
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
            {i18next.t('chat:subNotice.giftedSubTo', { tier: tierDisplay })}
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
            {i18next.t('chat:subNotice.giftedSub', { tier: tierDisplay })}
          </Text>,
        );
      }
      if (giftMonths !== undefined && giftMonths > 1) {
        parts.push(
          <Text key='giftMonths' style={styles.descriptionText}>
            {i18next.t('chat:subNotice.giftMonths', { count: giftMonths })}
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
          {i18next.t('chat:subNotice.continuingGiftSub')}
        </Text>,
      );
      if (promoName) {
        parts.push(
          <Text key='promo' style={styles.descriptionText}>
            {promoGiftTotal
              ? i18next.t('chat:subNotice.promoWithTotal', {
                  name: promoName,
                  total: promoGiftTotal,
                })
              : i18next.t('chat:subNotice.promo', { name: promoName })}
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
          {i18next.t('chat:subNotice.gifted')}
        </Text>,
      );
      parts.push(
        <Text key='count' style={styles.monthsHighlight}>
          {massGiftCount ?? 0}
        </Text>,
      );
      parts.push(
        <Text key='tail' style={styles.descriptionText}>
          {i18next.t('chat:subNotice.massGiftTail', {
            count: massGiftCount ?? 0,
            tier: tierDisplay,
          })}
        </Text>,
      );

      if (senderCount !== undefined && senderCount > 0) {
        parts.push(
          <Text key='senderCount' style={styles.descriptionText}>
            {i18next.t('chat:subNotice.senderCount', { count: senderCount })}
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
          {i18next.t('chat:subNotice.continuingTheGiftSub')}
        </Text>,
      );

      if (senderName) {
        parts.push(
          <Text key='from' style={styles.descriptionText}>
            {i18next.t('chat:subNotice.from')}
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
              ? i18next.t('chat:subNotice.promoWithTotal', {
                  name: promoName,
                  total: promoGiftTotal,
                })
              : i18next.t('chat:subNotice.promo', { name: promoName })}
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
            ? i18next.t('chat:subNotice.upgradedPrime')
            : i18next.t('chat:subNotice.upgradedPrimeToTier', {
                tier: tierDisplay,
              })}
        </Text>,
      );
      break;
    }
    case 'extendsub': {
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          {isPrime
            ? i18next.t('chat:subNotice.extendedWithPrime')
            : i18next.t('chat:subNotice.extendedWithTier', {
                tier: tierDisplay,
              })}
        </Text>,
      );
      break;
    }
    case 'standardpayforward': {
      parts.push(
        <Text key='action' style={styles.descriptionText}>
          {i18next.t('chat:subNotice.paidForward')}
        </Text>,
      );
      break;
    }
    case 'communitypayforward': {
      if (recipientDisplayName) {
        parts.push(
          <Text key='action' style={styles.descriptionText}>
            {i18next.t('chat:subNotice.paidForwardTo')}
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
            {i18next.t('chat:subNotice.paidForwardToCommunity')}
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
          {i18next.t('chat:subNotice.receivedPrimeFromCommunity')}
        </Text>,
      );
      break;
    }
    case 'anonsubgift': {
      if (recipientDisplayName) {
        parts.push(
          <Text key='action' style={styles.descriptionText}>
            {i18next.t('chat:subNotice.anonGiftedSubTo', {
              tier: tierDisplay,
            })}
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
            {i18next.t('chat:subNotice.anonGiftedSub', { tier: tierDisplay })}
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
          {i18next.t('chat:subNotice.anonGifted')}
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
          {i18next.t('chat:subNotice.subscriptionEvent')}
        </Text>,
      );
  }

  return parts;
}
