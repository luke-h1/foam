import { twitchQueries } from '@app/queries/twitchQueries';
import {
  listenNetworkConfirmed,
  listenNetworkLost,
} from '@app/utils/network/network-events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import {
  focusManager,
  onlineManager,
  QueryClient,
} from '@tanstack/react-query';
import {
  PersistQueryClientProvider,
  type PersistQueryClientProviderProps,
} from '@tanstack/react-query-persist-client';
import { PropsWithChildren, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

/**
 * Any query keys in this array will be persisted to AsyncStorage
 */
const PERSISTED_QUERIES = [
  twitchQueries.getTopStreams().queryKey,
  twitchQueries.getTopCategories().queryKey,
];

async function checkIsOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort();
    }, 15e3);
    const res = await fetch(
      `${process.env.AUTH_PROXY_API_BASE_URL}/api/healthcheck`,
      {
        cache: 'no-store',
        signal: controller.signal,
      },
    );

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

const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        structuralSharing: false,
        retry: 3,
        retryDelay: 3000,
      },
    },
  });
};

/**
 * Shared queryClient instance for use outside of React components
 * (e.g., in AuthContext for prefetching and cache invalidation)
 */
export const queryClient = createQueryClient();

const dehydrateOptions: PersistQueryClientProviderProps['persistOptions']['dehydrateOptions'] =
  {
    shouldDehydrateMutation: _ => false,
    shouldDehydrateQuery: query => {
      const queryKeyStr = JSON.stringify(
        (query as { queryKey?: unknown }).queryKey,
      );
      return PERSISTED_QUERIES.some(
        persistedKey => JSON.stringify(persistedKey) === queryKeyStr,
      );
    },
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
  const initialUserId = useRef(currentUserId);

  if (currentUserId !== initialUserId.current) {
    throw new Error(
      'Something is very wrong - expected userId to be stable due to key prop above',
    );
  }

  const [persistOptions] = useState(() => {
    const asyncPersister = createAsyncStoragePersister({
      storage: AsyncStorage,
      key: `query-cache-${currentUserId ?? 'logged-out'}`,
    });
    return {
      persister: asyncPersister,
      dehydrateOptions,
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
