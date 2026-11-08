type OnMessage = (
  channel: string,
  tags: Record<string, string>,
  text: string,
) => void;

interface SyntheticChatFloodArgs {
  channelName: string;
  channelId: string;
  onMessage: OnMessage;
  enabled: boolean;
}

let useSyntheticChatFlood: (args: SyntheticChatFloodArgs) => void = () => {};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  useSyntheticChatFlood =
    require('./use-synthetic-chat-flood').useSyntheticChatFlood;
}

export { useSyntheticChatFlood };
