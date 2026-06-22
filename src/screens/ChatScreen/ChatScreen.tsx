import { FC } from 'react';
import { StyleSheet,View } from 'react-native';

import { Chat } from '@app/components/Chat/Chat';

interface ChatScreenProps {
  channelId: string;
  channelName: string;
}

export const ChatScreen: FC<ChatScreenProps> = ({ channelId, channelName }) => {
  return (
    <View style={styles.container}>
      <Chat channelName={channelName} channelId={channelId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
