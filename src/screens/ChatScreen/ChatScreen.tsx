import { Chat, SafeAreaViewFixed } from '@app/components';
import { SettingsStackScreenProps } from '@app/navigators';
import { FC } from 'react';
import { StyleSheet } from 'react-native-unistyles';

export const ChatScreen: FC<SettingsStackScreenProps<'Chat'>> = ({
  route: { params },
}) => {
  const { channelId, channelName } = params;

  return (
    <SafeAreaViewFixed avoidTabBar style={styles.container}>
      <Chat channelName={channelName} channelId={channelId} />
    </SafeAreaViewFixed>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
