import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

/**
 * The Chat Perf harness (synthetic flood, fixture corpus, perf suite) must stay
 * out of production bundles. Inline EXPO_PUBLIC_APP_VARIANT literals let Metro
 * constant-fold the require away, dropping the whole chat perf harness from
 * production; don't hoist them into a shared constant (mirrors StorybookRoute.tsx).
 */
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
    require('@app/screens/DevTools/ChatPerfScreen').ChatPerfScreen;
}

export default ChatPerfRoute;
