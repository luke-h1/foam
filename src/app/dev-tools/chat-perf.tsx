import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

// Keep the EXPO_PUBLIC_APP_VARIANT checks as inline literals so Metro can constant-fold the require, and the chat perf harness, out of production builds. See storybook-route.tsx.
let ChatPerfRoute: ComponentType = function ChatPerfUnavailable() {
  return <Redirect href='/tabs/settings' />;
};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  ChatPerfRoute =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@app/screens/dev-tools/ChatPerfScreen').ChatPerfScreen;
}

export default ChatPerfRoute;
