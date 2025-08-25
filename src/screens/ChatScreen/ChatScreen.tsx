import { Chat } from '@app/components';
import { SettingsStackScreenProps } from '@app/navigators';
import { FC } from 'react';

export const ChatScreen: FC<SettingsStackScreenProps<'Chat'>> = ({
  route: { params },
}) => {
  const { channelId, channelName } = params;
  return <Chat channelName={channelName} channelId={channelId} />;
};
