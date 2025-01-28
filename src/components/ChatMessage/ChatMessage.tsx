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
    <View style={styles.container}>
      <View style={styles.htmlContainer}>
        <RenderHtml
          contentWidth={width}
          source={{
            html: item.htmlBadges,
          }}
        />
      </View>
      <Typography
        style={{
          color: item.tags.color,
        }}
      >
        {item.tags.username}
      </Typography>
      <View style={{ marginRight: 2 }} />
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
  );
}

const stylesheet = createStyleSheet(() => ({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  htmlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 2,
  },
}));

ChatMessage.displayName = 'ChatMessage';
