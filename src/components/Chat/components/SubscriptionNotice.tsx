import { Typography } from '@app/components/Typography';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { ParsedPart } from '@app/utils';
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

  const getSubscriptionText = () => {
    switch (msgId) {
      case 'sub':
        return `subscribed`;
      case 'resub': {
        const months =
          'months' in subscriptionEvent ? subscriptionEvent.months : 0;
        return `resubscribed for ${months} month${months > 1 ? 's' : ''}`;
      }
      case 'subgift': {
        const recipientDisplayName =
          'recipientDisplayName' in subscriptionEvent
            ? subscriptionEvent.recipientDisplayName
            : 'someone';
        return `gifted a subscription to ${recipientDisplayName}`;
      }
      case 'anongiftpaidupgrade':
        return `gifted a subscription`;
      default:
        return `subscription event`;
    }
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.notice}>
        <Typography style={styles.subscriptionText}>
          <Typography color="violet.accent">{displayName}</Typography>
          <Typography> {getSubscriptionText()}</Typography>
          {planDisplay && (
            <Typography color="gray.accentHover"> ({planDisplay})</Typography>
          )}
        </Typography>
      </View>
      {message && message.trim() && (
        <View style={styles.messageContainer}>
          <Typography style={styles.messageText}>{message}</Typography>
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
