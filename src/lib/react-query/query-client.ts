import { recordError } from '@app/lib/sentry';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { toast } from 'sonner-native';
import { twitchKeys } from './query-keys';
import i18next from '@app/i18n/i18next';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Skip the default error toast for this mutation. */
      suppressErrorToast?: boolean;
      /** User-facing message shown in the default error toast. */
      errorMessage?: string;
    };
  }
}

const WEB_QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export function handleQueryError(
  error: Error,
  queryKey: readonly unknown[],
): void {
  recordError({
    name: 'api_error',
    exceptionName: error.name,
    message: error.message,
    params: { queryKey },
    errorCause: error,
    // Group by query scope, not full key: keys often embed ids and
    // would otherwise explode into one Sentry issue per channel/user.
    fingerprint: [
      'query_error',
      String(queryKey[0] ?? 'unknown'),
      String(queryKey[1] ?? ''),
    ],
  });
}

export function handleMutationError(
  error: Error,
  meta: { suppressErrorToast?: boolean; errorMessage?: string } | undefined,
): void {
  recordError({
    name: 'api_error',
    exceptionName: error.name,
    message: error.message,
    errorCause: error,
    fingerprint: ['mutation_error', error.message],
  });

  if (!meta?.suppressErrorToast) {
    toast.error(meta?.errorMessage ?? i18next.t('common:requestFailed'));
  }
}

const createQueryClient = () => {
  return new QueryClient({
    queryCache: new QueryCache({
      // Fires once per query after retries are exhausted.
      onError: (error, query) => handleQueryError(error, query.queryKey),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        handleMutationError(error, mutation.meta),
    }),
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
