import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

let ChatPerfRoute: ComponentType = function ChatPerfUnavailable() {
  return <Redirect href='/tabs/settings' />;
};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  ChatPerfRoute =
    require('@app/screens/dev-tools/ChatPerfScreen').ChatPerfScreen;
}

export default ChatPerfRoute;
