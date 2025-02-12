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
        <View
          style={{
            flexDirection: 'row',
          }}
        >
          {item.badges}
          <Typography
            weight="bold"
            style={{
              color: item.user.color,
              marginLeft: 4,
            }}
          >
            {item.user.username}:
          </Typography>
        </View>

        {item.message}
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  htmlContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginLeft: 4,
    padding: theme.spacing.xs,
    marginVertical: theme.spacing.md,
  },
}));

ChatMessage.displayName = 'ChatMessage';
