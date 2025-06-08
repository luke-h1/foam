import { Chat } from '@app/components';
import { DevToolsStackScreenProps } from '@app/navigators';
import { FC } from 'react';

export const ChatScreen: FC<DevToolsStackScreenProps<'Chat'>> = ({
  route: { params },
}) => {
  const { channelId, channelName } = params;
  return <Chat channelName={channelName} channelId={channelId} />;
};
