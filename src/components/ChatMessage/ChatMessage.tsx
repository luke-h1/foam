import { Image } from 'expo-image';
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
          <Image
            source={item.badges[0]?.images[0]}
            style={{
              width: 20,
              height: 20,
            }}
          />
          <Typography
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
    marginRight: 2,
    marginVertical: theme.spacing.md,
  },
}));

ChatMessage.displayName = 'ChatMessage';
