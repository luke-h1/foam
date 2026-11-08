import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';

/**
 * Text styles for the parts of a subscription sentence. The notice builds
 * them from the chat scale so the sentence follows font scale and density.
 */
export interface SubscriptionDescriptionStyles {
  descriptionText: StyleProp<TextStyle>;
  emphasis: StyleProp<TextStyle>;
  name: StyleProp<TextStyle>;
}

export interface SubscriptionDescriptionInput {
  styles: SubscriptionDescriptionStyles;
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

interface PushStreakPartOptions {
  shouldShareStreak: boolean | undefined;
  streakMonths: number | undefined;
  styles: SubscriptionDescriptionStyles;
  tokens: ReactNode[];
}

function pushStreakPart({
  shouldShareStreak,
  streakMonths,
  styles,
  tokens,
}: PushStreakPartOptions): void {
  if (streakMonths === undefined || streakMonths <= 0 || !shouldShareStreak) {
    return;
  }

  tokens.push(
    <ChatText key='streak' style={styles.descriptionText}>
      {`, ${streakMonths} ${streakMonths === 1 ? 'month' : 'months'} in a row`}
    </ChatText>,
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
    styles,
  } = input;

  const tokens: ReactNode[] = [];

  switch (msgId) {
    case 'sub': {
      tokens.push(
        <ChatText key='action' style={styles.descriptionText}>
          {isPrime
            ? 'Subscribed with Prime.'
            : `Subscribed with ${tierDisplay}.`}
        </ChatText>,
      );

      break;
    }
    case 'resub': {
      const hasMonths = cumulativeMonths !== undefined && cumulativeMonths > 0;

      tokens.push(
        <ChatText key='action' style={styles.descriptionText}>
          {isPrime
            ? 'Subscribed with Prime.'
            : `Subscribed with ${tierDisplay}.`}
        </ChatText>,
      );

      if (hasMonths) {
        tokens.push(
          <ChatText key='months' style={styles.descriptionText}>
            {" They've subscribed for "}
          </ChatText>,
          <ChatText key='monthsCount' style={styles.emphasis}>
            {`${cumulativeMonths} ${cumulativeMonths === 1 ? 'month' : 'months'}`}
          </ChatText>,
        );

        pushStreakPart({
          shouldShareStreak,
          streakMonths,
          styles,
          tokens,
        });

        tokens.push(
          <ChatText key='period' style={styles.descriptionText}>
            .
          </ChatText>,
        );
      }

      break;
    }
    case 'subgift': {
      if (recipientDisplayName) {
        tokens.push(
          <ChatText key='action' style={styles.descriptionText}>
            {`Gifted a ${tierDisplay} subscription to `}
          </ChatText>,
          <ChatText key='recipient' style={styles.name}>
            {recipientDisplayName}
          </ChatText>,
        );
      } else {
        tokens.push(
          <ChatText key='action' style={styles.descriptionText}>
            {`Gifted a ${tierDisplay} subscription`}
          </ChatText>,
        );
      }

      if (giftMonths !== undefined && giftMonths > 1) {
        tokens.push(
          <ChatText key='giftMonths' style={styles.descriptionText}>
            {` (${giftMonths} months)`}
          </ChatText>,
        );
      }

      tokens.push(
        <ChatText key='period' style={styles.descriptionText}>
          .
        </ChatText>,
      );

      break;
    }
    case 'anongiftpaidupgrade': {
      tokens.push(
        <ChatText key='action' style={styles.descriptionText}>
          Continuing their gift subscription
        </ChatText>,
      );

      if (promoName) {
        tokens.push(
          <ChatText key='promo' style={styles.descriptionText}>
            {promoGiftTotal
              ? ` (${promoName}, ${promoGiftTotal} total)`
              : ` (${promoName})`}
          </ChatText>,
        );
      }

      tokens.push(
        <ChatText key='period' style={styles.descriptionText}>
          .
        </ChatText>,
      );

      break;
    }
    case 'submysterygift': {
      tokens.push(
        <ChatText key='action' style={styles.descriptionText}>
          {'Gifted '}
        </ChatText>,
        <ChatText key='count' style={styles.emphasis}>
          {massGiftCount ?? 0}
        </ChatText>,
      );

      tokens.push(
        <ChatText key='tail' style={styles.descriptionText}>
          {` ${tierDisplay} ${
            (massGiftCount ?? 0) === 1 ? 'subscription' : 'subscriptions'
          } to the community`}
        </ChatText>,
      );

      if (senderCount !== undefined && senderCount > 0) {
        tokens.push(
          <ChatText key='senderCount' style={styles.descriptionText}>
            {`. They've gifted ${senderCount} in the channel`}
          </ChatText>,
        );
      }

      tokens.push(
        <ChatText key='period' style={styles.descriptionText}>
          .
        </ChatText>,
      );

      break;
    }
    case 'giftpaidupgrade': {
      tokens.push(
        <ChatText key='action' style={styles.descriptionText}>
          Continuing the gift sub
        </ChatText>,
      );

      if (senderName) {
        tokens.push(
          <ChatText key='from' style={styles.descriptionText}>
            {' from '}
          </ChatText>,
          <ChatText key='sender' style={styles.name}>
            {senderName}
          </ChatText>,
        );
      }

      if (promoName) {
        tokens.push(
          <ChatText key='promo' style={styles.descriptionText}>
            {promoGiftTotal
              ? ` (${promoName}, ${promoGiftTotal} total)`
              : ` (${promoName})`}
          </ChatText>,
        );
      }

      tokens.push(
        <ChatText key='period' style={styles.descriptionText}>
          .
        </ChatText>,
      );

      break;
    }
    case 'primepaidupgrade': {
      tokens.push(
        <ChatText key='action' style={styles.descriptionText}>
          {isPrime
            ? 'Upgraded their Prime subscription.'
            : `Upgraded their Prime subscription to ${tierDisplay}.`}
        </ChatText>,
      );

      break;
    }
    case 'extendsub': {
      tokens.push(
        <ChatText key='action' style={styles.descriptionText}>
          {isPrime
            ? 'Extended their subscription with Prime.'
            : `Extended their subscription with ${tierDisplay}.`}
        </ChatText>,
      );

      break;
    }
    case 'standardpayforward': {
      tokens.push(
        <ChatText key='action' style={styles.descriptionText}>
          Paid their subscription forward to another viewer.
        </ChatText>,
      );
      break;
    }
    case 'communitypayforward': {
      if (recipientDisplayName) {
        tokens.push(
          <ChatText key='action' style={styles.descriptionText}>
            {'Paid their subscription forward to '}
          </ChatText>,
          <ChatText key='recipient' style={styles.name}>
            {recipientDisplayName}
          </ChatText>,
        );
      } else {
        tokens.push(
          <ChatText key='action' style={styles.descriptionText}>
            Paid their subscription forward to the community
          </ChatText>,
        );
      }

      tokens.push(
        <ChatText key='period' style={styles.descriptionText}>
          .
        </ChatText>,
      );

      break;
    }
    case 'primecommunitygiftreceived': {
      tokens.push(
        <ChatText key='action' style={styles.descriptionText}>
          Received a Prime subscription from the community.
        </ChatText>,
      );
      break;
    }
    case 'anonsubgift': {
      if (recipientDisplayName) {
        tokens.push(
          <ChatText key='action' style={styles.descriptionText}>
            {`An anonymous gifter gifted a ${tierDisplay} subscription to `}
          </ChatText>,
          <ChatText key='recipient' style={styles.name}>
            {recipientDisplayName}
          </ChatText>,
        );
      } else {
        tokens.push(
          <ChatText key='action' style={styles.descriptionText}>
            {`An anonymous gifter gifted a ${tierDisplay} subscription`}
          </ChatText>,
        );
      }

      tokens.push(
        <ChatText key='period' style={styles.descriptionText}>
          .
        </ChatText>,
      );

      break;
    }
    case 'anonsubmysterygift': {
      tokens.push(
        <ChatText key='action' style={styles.descriptionText}>
          {'An anonymous gifter gifted '}
        </ChatText>,
        <ChatText key='count' style={styles.emphasis}>
          {massGiftCount ?? 0}
        </ChatText>,
      );

      tokens.push(
        <ChatText key='tail' style={styles.descriptionText}>
          {' '}
          {tierDisplay} subscription{massGiftCount === 1 ? '' : 's'} to the
          community
        </ChatText>,
        <ChatText key='period' style={styles.descriptionText}>
          .
        </ChatText>,
      );

      break;
    }
    default:
      tokens.push(
        <ChatText key='action' style={styles.descriptionText}>
          Subscription event.
        </ChatText>,
      );
  }

  return tokens;
}
