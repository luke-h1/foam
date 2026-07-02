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
  return async () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    await fetchNextPage();
  };
}
