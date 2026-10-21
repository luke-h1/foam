import { StyleSheet, View } from 'react-native';
import type { FC } from 'react';

import { Chat } from '@app/components/chat/chat';

interface ChatScreenProps {
  channelId: string;
  channelName: string;
}

export const ChatScreen: FC<ChatScreenProps> = ({ channelId, channelName }) => {
  return (
    <View style={styles.container}>
      <Chat key={channelId} channelName={channelName} channelId={channelId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
