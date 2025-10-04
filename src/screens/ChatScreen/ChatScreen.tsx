import { Chat, SafeAreaViewFixed } from '@app/components';
import { SettingsStackScreenProps } from '@app/navigators';
import { FC } from 'react';

export const ChatScreen: FC<SettingsStackScreenProps<'Chat'>> = ({
  route: { params },
}) => {
  const { channelId, channelName } = params;

  console.log('🏠 ChatScreen render:', { channelId, channelName });

  return (
    <SafeAreaViewFixed avoidTabBar style={{ flex: 1 }}>
      <Chat channelName={channelName} channelId={channelId} />
    </SafeAreaViewFixed>
  );
};
