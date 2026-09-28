interface PageWithData<TItem> {
  data?: readonly (TItem | undefined | null)[];
}

function isDefined<TItem>(item: TItem | undefined | null): item is TItem {
  return item !== undefined && item !== null;
}

export function flattenInfiniteQueryPages<TItem>(
  pages: readonly (PageWithData<TItem> | undefined | null)[] | undefined,
): TItem[] {
  return pages?.flatMap(page => page?.data?.filter(isDefined) ?? []) ?? [];
}
