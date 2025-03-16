import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { FormattedChatMessage } from '../Chat';
import { Typography } from '../Typography';

interface Props {
  item: FormattedChatMessage;
}

export function ChatMessage({ item }: Props) {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={styles.htmlContainer}>
      <View style={styles.badgesContainer}>
        <View style={styles.badgesRow}>
          {item.badges}
          <Typography
            weight="bold"
            style={[styles.username, { color: item.user.color }]}
          >
            {item.user.username}:
          </Typography>
        </View>
        <View style={styles.messageContainer}>{item.message}</View>
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  htmlContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginLeft: 4,
    padding: theme.spacing.xs,
    marginVertical: theme.spacing.md,
    flex: 1,
  },
  username: {
    marginLeft: 4,
    flexShrink: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
}));

ChatMessage.displayName = 'ChatMessage';
