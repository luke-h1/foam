import { Chat, SafeAreaViewFixed } from '@app/components';

export interface ChatScreenParams {
  channelId: string;
  channelName: string;
}

export const ChatScreen = ({ channelId, channelName }: ChatScreenParams) => {
  console.log('🏠 ChatScreen render:', { channelId, channelName });

  return (
    <SafeAreaViewFixed avoidTabBar style={{ flex: 1 }}>
      <Chat channelName={channelName} channelId={channelId} />
    </SafeAreaViewFixed>
  );
};
