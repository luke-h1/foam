import { PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';

import {
  focusManager,
  onlineManager,
  QueryClientProvider,
} from '@tanstack/react-query';
import { fetch } from 'expo/fetch';

import { subscribeToAppStateTransitions } from '@app/utils/appState/appStateTransitions';
import {
  listenNetworkConfirmed,
  listenNetworkLost,
} from '@app/utils/network/network-events';

import { queryClient } from './query-client';

const authProxyBaseUrl = process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL;

async function checkIsOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort();
    }, 15e3);
    const res = await fetch(`${authProxyBaseUrl}/api/healthcheck`, {
      headers: { 'Cache-Control': 'no-store' },
      signal: controller.signal,
    });

    const json = (await res.json()) as { version: string };

    if (json.version) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

let receivedNetworkLost = false;
let receivedNetworkConfirmed = false;
let isNetworkStateUnclear = false;

listenNetworkLost(() => {
  receivedNetworkLost = true;
  onlineManager.setOnline(false);
});

listenNetworkConfirmed(() => {
  receivedNetworkConfirmed = true;
  onlineManager.setOnline(true);
});

let checkPromise: Promise<void> | undefined;

function checkIsOnlineIfNeeded() {
  if (checkPromise) {
    return;
  }
  receivedNetworkLost = false;
  receivedNetworkConfirmed = false;
  checkPromise = checkIsOnline().then(nextIsOnline => {
    checkPromise = undefined;
    if (nextIsOnline && receivedNetworkLost) {
      isNetworkStateUnclear = true;
    }
    if (!nextIsOnline && receivedNetworkConfirmed) {
      isNetworkStateUnclear = true;
    }
    if (!isNetworkStateUnclear) {
      onlineManager.setOnline(nextIsOnline);
    }
  });
}

// Only poll connectivity while the app is foregrounded — a lifetime interval
// keeps waking the JS thread in the background for work the guard skips.
let connectivityPollInterval: ReturnType<typeof setInterval> | undefined;

function startConnectivityPolling() {
  if (connectivityPollInterval) {
    return;
  }
  connectivityPollInterval = setInterval(() => {
    if (!onlineManager.isOnline() || isNetworkStateUnclear) {
      checkIsOnlineIfNeeded();
    }
  }, 2000);
}

function stopConnectivityPolling() {
  if (connectivityPollInterval) {
    clearInterval(connectivityPollInterval);
    connectivityPollInterval = undefined;
  }
}

if (AppState.currentState === 'active') {
  startConnectivityPolling();
}

subscribeToAppStateTransitions(({ current }) => {
  if (current === 'active') {
    startConnectivityPolling();
  } else {
    stopConnectivityPolling();
  }
});

// @ts-expect-error - not all codepaths return a value
focusManager.setEventListener(onFocus => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return subscribeToAppStateTransitions(({ current }) => {
      focusManager.setFocused(current === 'active');
    });
  }
  // eslint-disable-next-line no-undef
  if (typeof window !== 'undefined' && window.addEventListener) {
    // these handlers are a bit redundant but focus catches when the browser window
    // is blurred/focused while visibilitychange seems to only handle when the
    // window minimizes (both of them catch tab changes)
    // there's no harm to redundant fires because refetchOnWindowFocus is only
    // used with queries that employ stale data times
    const handler = () => onFocus();
    // eslint-disable-next-line no-undef
    window.addEventListener('focus', handler, false);
    // eslint-disable-next-line no-undef
    window.addEventListener('visibilitychange', handler, false);
    return () => {
      // eslint-disable-next-line no-undef
      window.removeEventListener('visibilitychange', handler);
      // eslint-disable-next-line no-undef
      window.removeEventListener('focus', handler);
    };
  }
});

export function QueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
