import { Chat } from '@app/components/Chat';
import { AppStackScreenProps } from '@app/navigators/AppNavigator';
import { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export const ChatScreen: FC<AppStackScreenProps<'Chat'>> = ({
  route: { params },
}) => {
  const { channelId, channelName } = params;

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
