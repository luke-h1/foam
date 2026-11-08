import { useLocalSearchParams } from 'expo-router';

import { withDevToolsGate } from '@app/components/dev-tools-gate/withDevToolsGate';
import { ChatScreen } from '@app/screens/chat/ChatScreen';

function ChatRoute() {
  const { channelId = '', channelName = '' } = useLocalSearchParams<{
    channelId?: string;
    channelName?: string;
  }>();

  return <ChatScreen channelId={channelId} channelName={channelName} />;
}

const GatedChatRoute = withDevToolsGate(ChatRoute);

export default GatedChatRoute;
