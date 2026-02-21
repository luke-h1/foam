import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface SubscriptionNoticeProps {
  part: ParsedPart<'sub' | 'resub' | 'anongiftpaidupgrade' | 'anongift'>;
  notice_tags?: UserNoticeTags;
  parsedMessage?: ParsedPart[];
}

export function SubscriptionNotice({
  part,
  notice_tags: _,
  parsedMessage,
}: SubscriptionNoticeProps) {
  const { subscriptionEvent } = part;
  const { msgId, displayName, message } = subscriptionEvent;

  const renderMessagePart = (messagePart: ParsedPart, index: number) => {
    switch (messagePart.type) {
      case 'text':
        return (
          <Text key={index} style={styles.messageText}>
            {messagePart.content}
          </Text>
        );
      case 'emote':
        return (
          <Image
            key={index}
            source={messagePart.url}
            style={styles.emote}
            transition={0}
          />
        );
      default:
        return null;
    }
  };

  const cumulativeMonths =
    'months' in subscriptionEvent ? subscriptionEvent.months : undefined;

  const streakMonths =
    'streakMonths' in subscriptionEvent
      ? subscriptionEvent.streakMonths
      : undefined;

  const shouldShareStreak =
    'shouldShareStreak' in subscriptionEvent
      ? subscriptionEvent.shouldShareStreak
      : undefined;

  const giftMonths =
    'giftMonths' in subscriptionEvent
      ? subscriptionEvent.giftMonths
      : undefined;

  const recipientDisplayName =
    'recipientDisplayName' in subscriptionEvent
      ? subscriptionEvent.recipientDisplayName
      : undefined;

  const promoName =
    'promoName' in subscriptionEvent ? subscriptionEvent.promoName : undefined;

  const promoGiftTotal =
    'promoGiftTotal' in subscriptionEvent
      ? subscriptionEvent.promoGiftTotal
      : undefined;

  const getTierDisplay = () => {
    if ('plan' in subscriptionEvent && subscriptionEvent.plan) {
      switch (subscriptionEvent.plan) {
        case '1000':
        case 'Prime':
          return 'Prime';
        case '2000':
          return 'Tier 1';
        case '3000':
          return 'Tier 2';
        case '3001':
          return 'Tier 3';
        default:
          return 'Tier 1';
      }
    }
    if ('planName' in subscriptionEvent && subscriptionEvent.planName) {
      return subscriptionEvent.planName;
    }
    return 'Tier 1';
  };

  const tierDisplay = getTierDisplay();
  const isPrime = tierDisplay === 'Prime';

  const buildDescription = () => {
    const parts: ReactNode[] = [];

    switch (msgId) {
      case 'sub': {
        parts.push(
          <Text key="action" style={styles.descriptionText}>
            Subscribed{isPrime ? ' with Prime' : ` with ${tierDisplay}`}.
          </Text>,
        );
        break;
      }
      case 'resub': {
        const hasMonths =
          cumulativeMonths !== undefined && cumulativeMonths > 0;

        parts.push(
          <Text key="action" style={styles.descriptionText}>
            Subscribed{isPrime ? ' with Prime' : ` with ${tierDisplay}`}.
          </Text>,
        );

        if (hasMonths) {
          parts.push(
            <Text key="months" style={styles.descriptionText}>
              {' '}
              They&apos;ve subscribed for{' '}
            </Text>,
          );
          parts.push(
            <Text key="monthsCount" style={styles.monthsHighlight}>
              {cumulativeMonths} month{cumulativeMonths > 1 ? 's' : ''}
            </Text>,
          );

          if (
            streakMonths !== undefined &&
            streakMonths > 0 &&
            shouldShareStreak
          ) {
            parts.push(
              <Text key="streak" style={styles.descriptionText}>
                , {streakMonths} month{streakMonths > 1 ? 's' : ''} in a row
              </Text>,
            );
          }

          parts.push(
            <Text key="period" style={styles.descriptionText}>
              .
            </Text>,
          );
        }
        break;
      }
      case 'subgift': {
        if (recipientDisplayName) {
          parts.push(
            <Text key="action" style={styles.descriptionText}>
              Gifted a {tierDisplay} subscription to{' '}
            </Text>,
          );
          parts.push(
            <Text key="recipient" style={styles.recipientName}>
              {recipientDisplayName}
            </Text>,
          );
        } else {
          parts.push(
            <Text key="action" style={styles.descriptionText}>
              Gifted a {tierDisplay} subscription
            </Text>,
          );
        }
        if (giftMonths !== undefined && giftMonths > 1) {
          parts.push(
            <Text key="giftMonths" style={styles.descriptionText}>
              {' '}
              ({giftMonths} months)
            </Text>,
          );
        }
        parts.push(
          <Text key="period" style={styles.descriptionText}>
            .
          </Text>,
        );
        break;
      }
      case 'anongiftpaidupgrade': {
        parts.push(
          <Text key="action" style={styles.descriptionText}>
            Continuing their gift subscription
          </Text>,
        );
        if (promoName) {
          parts.push(
            <Text key="promo" style={styles.descriptionText}>
              {' '}
              ({promoName}
              {promoGiftTotal ? `, ${promoGiftTotal} total` : ''})
            </Text>,
          );
        }
        parts.push(
          <Text key="period" style={styles.descriptionText}>
            .
          </Text>,
        );
        break;
      }
      default:
        parts.push(
          <Text key="action" style={styles.descriptionText}>
            Subscription event.
          </Text>,
        );
    }

    return parts;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerLine}>
        <Icon icon="star" size={14} color="#FFD700" style={styles.starIcon} />
        <Text style={styles.username}>{displayName}</Text>
        <View style={styles.descriptionContainer}>{buildDescription()}</View>
      </View>

      {/* User message if present - render with emotes if parsed */}
      {(parsedMessage && parsedMessage.length > 0) || message ? (
        <View style={styles.messageContainer}>
          {parsedMessage && parsedMessage.length > 0
            ? parsedMessage.map(renderMessagePart)
            : message && (
                <Text style={styles.messageText}>{message.trim()}</Text>
              )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    width: '100%',
    paddingVertical: theme.spacing.xs,
  },
  headerLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: theme.spacing.sm,
    alignItems: 'center',
  },
  username: {
    color: theme.colors.violet.accent,
    fontWeight: '600',
    marginRight: theme.spacing.xs,
  },
  descriptionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
  },
  descriptionText: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.sm,
  },
  monthsHighlight: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.sm,
    fontWeight: '700',
  },
  recipientName: {
    color: theme.colors.violet.accent,
    fontWeight: '600',
    fontSize: theme.font.fontSize.sm,
  },
  messageContainer: {
    marginTop: theme.spacing.xs,
    paddingLeft: theme.spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  messageText: {
    fontSize: theme.font.fontSize.sm,
    color: theme.colors.gray.text,
    fontStyle: 'italic',
  },
  emote: {
    width: 24,
    height: 24,
    marginHorizontal: 2,
  },
}));
