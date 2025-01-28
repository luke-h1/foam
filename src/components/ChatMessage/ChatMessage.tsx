import { useWindowDimensions, View } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { FormattedChatMessage } from '../Chat';
import { Typography } from '../Typography';

interface Props {
  item: FormattedChatMessage;
}

export function ChatMessage({ item }: Props) {
  const { width } = useWindowDimensions();
  const { styles, theme } = useStyles(stylesheet);

  return (
    <View style={styles.htmlContainer}>
      <View style={styles.badgesContainer}>
        <View
          style={{
            flexDirection: 'row',
          }}
        >
          <RenderHtml
            contentWidth={width}
            source={{
              html: item.htmlBadges,
            }}
          />
          <Typography
            style={{
              color: item.tags.color,
              marginLeft: 4,
            }}
          >
            {item.tags.username}:
          </Typography>
        </View>

        <RenderHtml
          contentWidth={width}
          baseStyle={{
            color: theme.colors.text,
          }}
          source={{
            html: item.htmlMessage,
          }}
        />
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
