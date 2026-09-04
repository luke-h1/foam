import { PropsWithChildren } from 'react';
import { AppState, InteractionManager, Platform } from 'react-native';

import {
  focusManager,
  onlineManager,
  QueryClientProvider,
} from '@tanstack/react-query';
import { fetch } from 'expo/fetch';

import { subscribeToAppStateTransitions } from '@app/utils/appState/appStateTransitions';

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

    const healthcheck: unknown = await res.json();

    return (
      healthcheck instanceof Object &&
      'version' in healthcheck &&
      Boolean(healthcheck.version)
    );
  } catch {
    return false;
  }
}

let checkPromise: Promise<void> | undefined;

function checkIsOnlineIfNeeded() {
  if (checkPromise) {
    return;
  }
  checkPromise = checkIsOnline().then(nextIsOnline => {
    checkPromise = undefined;
    onlineManager.setOnline(nextIsOnline);
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
    if (!onlineManager.isOnline()) {
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

// Armed after boot interactions settle - a module-scope start would poll at 2 Hz through startup; the AppState subscription and reconcile fallback cover earlier transitions.
InteractionManager.runAfterInteractions(() => {
  if (AppState.currentState === 'active') {
    startConnectivityPolling();
  }
});

subscribeToAppStateTransitions(({ current }) => {
  if (current === 'active') {
    startConnectivityPolling();
  } else {
    stopConnectivityPolling();
  }
});

// Some Android OEMs occasionally drop AppState 'change' events, which would stop polling forever. Both start/stop are idempotent, so reconcile against the actual state.
const APP_STATE_RECONCILE_INTERVAL_MS = 15_000;

// On globalThis so Fast Refresh re-evaluation can't leak a second interval.
declare global {
  var __foamAppStateReconcileInterval:
    ReturnType<typeof setInterval> | undefined;
}

if (globalThis.__foamAppStateReconcileInterval) {
  clearInterval(globalThis.__foamAppStateReconcileInterval);
}
globalThis.__foamAppStateReconcileInterval = setInterval(() => {
  if (AppState.currentState === 'active') {
    startConnectivityPolling();
  } else {
    stopConnectivityPolling();
  }
}, APP_STATE_RECONCILE_INTERVAL_MS);

// @ts-expect-error - not all codepaths return a value
focusManager.setEventListener(onFocus => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return subscribeToAppStateTransitions(({ current }) => {
      focusManager.setFocused(current === 'active');
    });
  }
  if (globalThis.window) {
    // focus and visibilitychange overlap but cover different cases; redundant fires are harmless with stale times.
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
