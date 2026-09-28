import { useMemo } from 'react';

import { flattenInfiniteQueryPages } from '@app/utils/pagination/flatten-infinite-query-pages';

interface PageWithData<TItem> {
  data?: readonly (TItem | undefined | null)[];
}

export function useFlattenedInfiniteQuery<TItem>(
  pages: readonly (PageWithData<TItem> | undefined | null)[] | undefined,
): TItem[] {
  return useMemo(() => flattenInfiniteQueryPages(pages), [pages]);
}
