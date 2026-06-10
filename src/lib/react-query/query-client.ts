import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { twitchKeys } from './query-keys';

const WEB_QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Platform.OS === 'web' ? WEB_QUERY_CACHE_MAX_AGE : undefined,
        staleTime: 30_000,
        networkMode: 'offlineFirst',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        structuralSharing: false,
        retry: 3,
        retryDelay: 3000,
      },
    },
  });
};

export const queryClient = createQueryClient();

/**
 * Query scopes safe to persist between reloads. These are read-heavy Twitch
 * lookups used by the home, category, following, and livestream screens.
 */
const PERSISTED_TWITCH_SCOPES = new Set<string>([
  'stream',
  'user',
  'category',
  'followedStreams',
  'topStreams',
  'topCategories',
  'streamsByCategory',
]);

export function shouldPersistQuery(queryKey: readonly unknown[]) {
  return (
    queryKey[0] === twitchKeys.all[0] &&
    typeof queryKey[1] === 'string' &&
    PERSISTED_TWITCH_SCOPES.has(queryKey[1])
  );
}
