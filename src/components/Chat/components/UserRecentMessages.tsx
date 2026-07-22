import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import type { RecentUserMessage } from '../util/getRecentUserMessages';

export function UserRecentMessages({
  messages,
}: {
  messages: RecentUserMessage[];
}) {
  const { t } = useTranslation('chat');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  if (messages.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.recentMessages,
        { backgroundColor: theme.color.surfaceAlpha[scheme] },
      ]}
    >
      <Text
        style={[
          styles.recentMessagesTitle,
          { color: theme.color.textSecondary[scheme] },
        ]}
        weight='semibold'
      >
        {t('userActions.recentMessages')}
      </Text>
      {messages.map(message => (
        <Text
          key={message.key}
          numberOfLines={1}
          style={[
            styles.recentMessageText,
            { color: theme.color.text[scheme] },
          ]}
        >
          {message.timestamp ? (
            <Text
              style={[
                styles.recentMessageTimestamp,
                { color: theme.color.textSecondary[scheme] },
              ]}
            >
              {`${message.timestamp}  `}
            </Text>
          ) : null}
          {message.text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  recentMessages: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    gap: 4,
    marginBottom: theme.space8,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  recentMessagesTitle: {
    fontSize: theme.fontSize11,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  recentMessageText: {
    fontSize: theme.fontSize12,
    lineHeight: 18,
  },
  recentMessageTimestamp: {
    fontSize: theme.fontSize11,
  },
});
