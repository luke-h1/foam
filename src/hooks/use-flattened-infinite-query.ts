import { useMemo } from 'react';

import { flattenInfiniteQueryPages } from '@app/utils/pagination/flattenInfiniteQueryPages';

interface PageWithData<TItem> {
  data?: readonly (TItem | undefined | null)[];
}

export function useFlattenedInfiniteQuery<TItem extends { id: string }>(
  pages: readonly (PageWithData<TItem> | undefined | null)[] | undefined,
): TItem[] {
  return useMemo(() => flattenInfiniteQueryPages(pages), [pages]);
}
