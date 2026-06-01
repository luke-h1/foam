import { useCallback } from 'react';

interface InfiniteQueryLoadMoreOptions {
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage?: boolean;
}

export function useInfiniteQueryLoadMore({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage = false,
}: InfiniteQueryLoadMoreOptions) {
  return useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    await fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
}
