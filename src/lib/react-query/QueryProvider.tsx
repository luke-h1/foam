import { type PropsWithChildren, useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import {
  focusManager,
  onlineManager,
  QueryClientProvider,
} from '@tanstack/react-query';
import { fetch } from 'expo/fetch';
import * as Network from 'expo-network';
import { z } from 'zod';

import { authProxyBaseUrl } from '@app/services/api/env';
import { subscribeToAppStateTransitions } from '@app/utils/app-state/appStateTransitions';
import { runWhenIdle } from '@app/utils/runWhenIdle';

import { queryClient } from './queryClient';

async function checkIsOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();

    const abortTimer = setTimeout(() => {
      controller.abort();
    }, 15e3);

    // The base URL already ends in `/api`.
    const res = await fetch(`${authProxyBaseUrl}/healthcheck`, {
      headers: { 'Cache-Control': 'no-store' },
      signal: controller.signal,
    }).finally(() => clearTimeout(abortTimer));

    // The proxy answers `{ "status": "OK" }`. Any other body, including a
    // 404 page, means the backend is unreachable.
    return z.object({ status: z.literal('OK') }).safeParse(await res.json())
      .success;
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

const CONNECTIVITY_POLL_BASE_MS = 2000;
const CONNECTIVITY_POLL_MAX_MS = 30_000;
const APP_STATE_RECONCILE_INTERVAL_MS = 15_000;

function useConnectivityWatch(): void {
  useEffect(() => {
    let polling = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let delayMs = CONNECTIVITY_POLL_BASE_MS;

    const clearPollTimer = () => {
      if (!pollTimer) {
        return;
      }

      clearTimeout(pollTimer);
      pollTimer = undefined;
    };

    const schedulePoll = () => {
      if (!polling || pollTimer || onlineManager.isOnline()) {
        return;
      }

      pollTimer = setTimeout(() => {
        pollTimer = undefined;

        if (!polling || onlineManager.isOnline()) {
          delayMs = CONNECTIVITY_POLL_BASE_MS;
          return;
        }

        checkIsOnlineIfNeeded();
        delayMs = Math.min(delayMs * 2, CONNECTIVITY_POLL_MAX_MS);
        schedulePoll();
      }, delayMs);
    };

    const startPolling = () => {
      if (polling) {
        return;
      }

      polling = true;
      schedulePoll();
    };

    const stopPolling = () => {
      polling = false;
      clearPollTimer();
      delayMs = CONNECTIVITY_POLL_BASE_MS;
    };

    const syncToAppState = () => {
      if (AppState.currentState === 'active') {
        startPolling();
        return;
      }

      stopPolling();
    };

    const unsubscribeOnline = onlineManager.subscribe(isOnline => {
      if (isOnline) {
        delayMs = CONNECTIVITY_POLL_BASE_MS;
        clearPollTimer();
        return;
      }

      schedulePoll();
    });

    const unsubscribeAppState = subscribeToAppStateTransitions(
      ({ current }) => {
        if (current === 'active') {
          startPolling();
          return;
        }

        stopPolling();
      },
    );

    const idleTask = runWhenIdle(syncToAppState);

    const reconcileTimer = setInterval(
      syncToAppState,
      APP_STATE_RECONCILE_INTERVAL_MS,
    );

    return () => {
      idleTask.cancel();
      unsubscribeOnline();
      unsubscribeAppState();
      clearInterval(reconcileTimer);
      stopPolling();
    };
  }, []);
}

focusManager.setEventListener(onFocus => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return subscribeToAppStateTransitions(({ current }) => {
      focusManager.setFocused(current === 'active');
    });
  }

  if (globalThis.window) {
    // focus and visibilitychange overlap but cover different cases; redundant fires are harmless with stale times.
    const handler = () => onFocus();

    window.addEventListener('focus', handler, false);

    window.addEventListener('visibilitychange', handler, false);

    return () => {
      window.removeEventListener('visibilitychange', handler);
      window.removeEventListener('focus', handler);
    };
  }

  return undefined;
});

onlineManager.setEventListener(setOnline => {
  const eventSubscription = Network.addNetworkStateListener(state => {
    setOnline(!!state.isConnected);
  });

  return eventSubscription.remove;
});

export function QueryProvider({ children }: PropsWithChildren) {
  useConnectivityWatch();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
