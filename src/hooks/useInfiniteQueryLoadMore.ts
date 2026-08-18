interface InfiniteQueryLoadMoreOptions<TPage> {
  fetchNextPage: () => Promise<TPage>;
  hasNextPage: boolean;
  isFetchingNextPage?: boolean;
}

export function useInfiniteQueryLoadMore<TPage>({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage = false,
}: InfiniteQueryLoadMoreOptions<TPage>) {
  return async () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    await fetchNextPage();
  };
}
