import {
  topCategoriesInfiniteQueryOptions,
  topStreamsInfiniteQueryOptions,
} from '@app/lib/react-query/queries/twitch';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

/**
 * Prefetches top streams and categories once after the component mounts so
 * those tabs feel instant on first open.
 */
export function usePrefetchOnMount() {
  const queryClient = useQueryClient();
  const prefetched = useRef(false);

  useEffect(() => {
    if (prefetched.current) return;
    prefetched.current = true;

    void queryClient.prefetchInfiniteQuery(topStreamsInfiniteQueryOptions());
    void queryClient.prefetchInfiniteQuery(topCategoriesInfiniteQueryOptions());
  }, [queryClient]);
}
