import { Typography } from '@app/components/Typography';
import { ParsedPart } from '@app/utils';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface SubscriptionNoticeProps {
  part: ParsedPart<'twitch_subscription'>;
}

export function SubscriptionNotice({ part }: SubscriptionNoticeProps) {
  const { subscriptionEvent } = part;
  const {
    msgId,
    displayName,
    message,
    months,
    planName,
    recipientDisplayName,
  } = subscriptionEvent;

  const getSubscriptionText = () => {
    switch (msgId) {
      case 'sub':
        return `subscribed`;
      case 'resub':
        return `resubscribed for ${months || 0} month${months && months > 1 ? 's' : ''}`;
      case 'subgift':
        return `gifted a subscription to ${recipientDisplayName || 'someone'}`;
      case 'submysterygift':
        return `gifted ${subscriptionEvent.giftMonths || 0} subscription${subscriptionEvent.giftMonths && subscriptionEvent.giftMonths > 1 ? 's' : ''}`;
      case 'raid':
        return `raided with ${subscriptionEvent.viewerCount || 0} viewer${subscriptionEvent.viewerCount && subscriptionEvent.viewerCount > 1 ? 's' : ''}`;
      default:
        return `subscription event`;
    }
  };

  const getPlanDisplay = () => {
    if (planName) {
      return planName;
    }
    if (subscriptionEvent.plan) {
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
