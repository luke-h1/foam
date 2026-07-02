import { Platform } from 'react-native';

import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import i18next from '@app/i18n/i18next';
import { logger } from '@app/utils/logger';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /**
       * Skip the default error toast for this mutation.
       */
      suppressErrorToast?: boolean;
      /**
       * User-facing message shown in the default error toast.
       */
      errorMessage?: string;
    };
  }
}

const WEB_QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export function handleQueryError(
  error: Error,
  queryKey: readonly unknown[],
): void {
  logger.api.error(error.message, {
    name: 'api_error',
    exceptionName: error.name,
    error,
    queryKey,
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
  logger.api.error(error.message, {
    name: 'api_error',
    exceptionName: error.name,
    error,
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
