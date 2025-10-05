import { ChatScreen, ChatScreenParams } from '@app/screens/ChatScreen';
import { useGlobalSearchParams } from 'expo-router';

type ChatParams = {
  [K in keyof ChatScreenParams]: string;
};

export default function ChatView() {
  const { channelId, channelName } = useGlobalSearchParams<ChatParams>();
  return <ChatScreen channelId={channelId} channelName={channelName} />;
}
