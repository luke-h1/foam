import { fetch } from 'expo/fetch';
import {
  listenNetworkConfirmed,
  listenNetworkLost,
} from '@app/utils/network/network-events';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { queryClient, shouldPersistQuery } from './query-client';
import { createQueryPersister } from './query-persister';
import {
  PersistQueryClientProvider,
  type PersistQueryClientProviderProps,
} from '@tanstack/react-query-persist-client';
import { PropsWithChildren, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

const WEB_QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

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

setInterval(() => {
  if (AppState.currentState === 'active') {
    if (!onlineManager.isOnline() || isNetworkStateUnclear) {
      checkIsOnlineIfNeeded();
    }
  }
}, 2000);

// @ts-expect-error - not all codepaths return a value
focusManager.setEventListener(onFocus => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const subscription = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        focusManager.setFocused(status === 'active');
      },
    );

    return () => subscription.remove();
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

const dehydrateOptions: PersistQueryClientProviderProps['persistOptions']['dehydrateOptions'] =
  {
    shouldDehydrateMutation: _ => false,
    // Only persist settled successful queries. Persisting pending queries
    // makes the next launch resume them before auth has set a token, so
    // they reject and get re-persisted as pending again, forever.
    shouldDehydrateQuery: query =>
      query.state.status === 'success' && shouldPersistQuery(query.queryKey),
  };

interface QueryProviderProps extends PropsWithChildren {
  currentUserId?: string;
}

export function QueryProvider({ children, currentUserId }: QueryProviderProps) {
  return (
    <QueryProviderInner key={currentUserId} currentUserId={currentUserId}>
      {children}
    </QueryProviderInner>
  );
}

function QueryProviderInner({ children, currentUserId }: QueryProviderProps) {
  const [persistOptions] = useState(() => {
    const persister = createQueryPersister(
      `query-cache-${currentUserId ?? 'logged-out'}`,
    );
    return {
      persister,
      dehydrateOptions,
      maxAge: WEB_QUERY_CACHE_MAX_AGE,
    };
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
