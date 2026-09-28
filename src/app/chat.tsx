import { useLocalSearchParams } from 'expo-router';

import { ChatScreen } from '@app/screens/chat-screen/chat-screen';

export default function ChatRoute() {
  const { channelId = '', channelName = '' } = useLocalSearchParams<{
    channelId?: string;
    channelName?: string;
  }>();

  return <ChatScreen channelId={channelId} channelName={channelName} />;
}
