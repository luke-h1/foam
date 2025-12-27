import { Typography } from '@app/components/Typography';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface SubscriptionNoticeProps {
  part: ParsedPart<'sub' | 'resub' | 'anongiftpaidupgrade' | 'anongift'>;
  notice_tags?: UserNoticeTags;
}

export function SubscriptionNotice({
  part,
  notice_tags: _,
}: SubscriptionNoticeProps) {
  const { subscriptionEvent } = part;
  const { msgId, displayName, message } = subscriptionEvent;

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

  const getPlanDisplay = () => {
    if ('planName' in subscriptionEvent && subscriptionEvent.planName) {
      return subscriptionEvent.planName;
    }
    if ('plan' in subscriptionEvent && subscriptionEvent.plan) {
      switch (subscriptionEvent.plan) {
        case '1000':
          return 'Prime';
        case '2000':
          return 'Tier 1';
        case '3000':
          return 'Tier 2';
        case '3001':
          return 'Tier 3';
        default:
          return '';
      }
    }
    return '';
  };

  const planDisplay = getPlanDisplay();
  const isPrime =
    planDisplay === 'Prime' ||
    ('plan' in subscriptionEvent && subscriptionEvent.plan === '1000');
  const isResub = msgId === 'resub';

  const buildSubMessage = useCallback(() => {
    const parts: React.ReactNode[] = [];

    parts.push(
      <Typography key="name" color="violet.accent">
        {displayName}
      </Typography>,
    );

    let actionText = '';
    switch (msgId) {
      case 'sub': {
        if (isPrime) {
          actionText = 'subscribed with Prime';
        } else {
          actionText = 'subscribed';
        }
        break;
      }
      case 'resub': {
        const hasMonths =
          cumulativeMonths !== undefined && cumulativeMonths > 0;
        const monthsText = hasMonths
          ? ` for ${cumulativeMonths} month${cumulativeMonths > 1 ? 's' : ''}`
          : '';
        const primeText = isPrime ? ' with Prime' : '';
        actionText = `resubscribed${monthsText}${primeText}`;
        break;
      }

      case 'subgift': {
        if (recipientDisplayName) {
          actionText = `gifted a subscription to ${recipientDisplayName}`;
        } else {
          actionText = 'gifted a subscription';
        }
        if (giftMonths !== undefined && giftMonths > 0) {
          actionText += ` (${giftMonths} month${giftMonths > 1 ? 's' : ''})`;
        }
        if (isPrime) {
          actionText += ' with Prime';
        }
        break;
      }
      case 'anongiftpaidupgrade': {
        actionText = 'gifted a subscription';
        if (promoName) {
          actionText += ` (${promoName}`;
          if (promoGiftTotal) {
            actionText += `, ${promoGiftTotal} total)`;
          } else {
            actionText += ')';
          }
        }
        break;
      }
      default:
        actionText = 'subscription event';
    }

    parts.push(<Typography key="action"> {actionText}</Typography>);

    // Streak information (for sub/resub)
    if (
      (msgId === 'sub' || msgId === 'resub') &&
      streakMonths !== undefined &&
      streakMonths > 0 &&
      shouldShareStreak
    ) {
      parts.push(
        <Typography key="streak" color="gray.accentHover">
          , {streakMonths} month{streakMonths > 1 ? 's' : ''} in a row
        </Typography>,
      );
    }

    if (planDisplay && !isPrime) {
      parts.push(
        <Typography key="plan" color="gray.accentHover">
          {' '}
          ({planDisplay})
        </Typography>,
      );
    }

    return parts;
  }, [
    cumulativeMonths,
    displayName,
    giftMonths,
    isPrime,
    msgId,
    planDisplay,
    promoGiftTotal,
    promoName,
    recipientDisplayName,
    shouldShareStreak,
    streakMonths,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.notice}>
        {isResub ? (
          <View style={styles.resubBadge}>
            <Typography style={styles.resubBadgeText}>RESUB</Typography>
          </View>
        ) : (
          <View style={styles.newSubBadge}>
            <Typography style={styles.newSubBadgeText}>NEW</Typography>
          </View>
        )}
        <Typography style={styles.subscriptionText}>
          {buildSubMessage()}
        </Typography>
      </View>

      {message && (
        <View style={styles.messageContainer}>
          <Typography style={styles.messageText}>{message.trim()}</Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    width: '100%',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.gray.uiActive,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: theme.colors.violet.accent,
    borderRightColor: theme.colors.violet.accent,
    borderCurve: 'continuous',
    marginVertical: theme.spacing.xs,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resubBadge: {
    backgroundColor: theme.colors.violet.accent,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  resubBadgeText: {
    fontSize: theme.font.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.violet.contrast,
  },
  newSubBadge: {
    backgroundColor: theme.colors.green.accent,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  newSubBadgeText: {
    fontSize: theme.font.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.green.contrast,
  },
  subscriptionText: {
    fontSize: theme.font.fontSize.sm,
  },
  messageContainer: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray.border,
  },
  messageText: {
    fontSize: theme.font.fontSize.sm,
    color: theme.colors.gray.text,
    fontStyle: 'italic',
  },
}));
