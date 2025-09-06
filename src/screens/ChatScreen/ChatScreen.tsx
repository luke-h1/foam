import { Chat } from '@app/components';
import { SettingsStackScreenProps } from '@app/navigators';
import { FC } from 'react';
import { View } from 'react-native';

export const ChatScreen: FC<SettingsStackScreenProps<'Chat'>> = ({
  route: { params },
}) => {
  const { channelId, channelName } = params;

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: 100, // Hacky fix for tab bar height - will refactor in future
      }}
    >
      <Chat channelName={channelName} channelId={channelId} />
    </View>
  );
};
