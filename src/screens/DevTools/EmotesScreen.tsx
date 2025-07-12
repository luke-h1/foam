import { EmoteMenu } from '@app/components/EmoteMenu';
import { useRecentEmotes } from '@app/hooks/useRecentEmotes';
import { DevToolsStackScreenProps } from '@app/navigators';
import { SanitisiedEmoteSet } from '@app/services/seventTvService';
import { useChatStore } from '@app/store/chatStore';
import { logger } from '@app/utils/logger';
import { FC, useEffect } from 'react';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export const EmotesScreen: FC<DevToolsStackScreenProps<'Emotes'>> = ({
  route: { params },
}) => {
  logger.main.info(params);
  const { styles } = useStyles(stylesheet);
  const { recentEmotes, addRecentEmote } = useRecentEmotes();

  const { loadChannelResources } = useChatStore();

  useEffect(() => {
    void loadChannelResources(params.channelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmotePress = (emote: SanitisiedEmoteSet) => {
    addRecentEmote(emote);
    logger.main.info('Emote pressed:', emote.name);
  };

  return (
    <View style={styles.container}>
      <EmoteMenu onEmotePress={handleEmotePress} recentEmotes={recentEmotes} />
    </View>
  );
};
const stylesheet = createStyleSheet(() => ({
  container: {
    flex: 1,
    paddingVertical: 84,
  },
}));
