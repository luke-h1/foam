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

// No-op in production: the synthetic flood and its IRC fixture corpus
// (ircFixtureMessages) only run in the dev-gated Chat Perf screen. The inline
// EXPO_PUBLIC_APP_VARIANT literals let Metro drop the require — and the fixtures
// — from production; do not hoist them into a shared constant (mirrors
// StorybookRoute.tsx).
let useSyntheticChatFlood: (args: SyntheticChatFloodArgs) => void = () => {};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useSyntheticChatFlood =
    require('./useSyntheticChatFlood').useSyntheticChatFlood;
}

export { useSyntheticChatFlood };
