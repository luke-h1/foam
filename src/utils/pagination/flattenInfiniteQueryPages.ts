interface PageWithData<TItem> {
  data?: readonly (TItem | undefined | null)[];
}

/**
 * Twitch re-ranks live lists between page requests, so one item can come back
 * on two pages. FlashList finds the row to hold in place by its key, so a
 * duplicate `id` makes the list jump and load the next page again.
 */
export function flattenInfiniteQueryPages<TItem extends { id: string }>(
  pages: readonly (PageWithData<TItem> | undefined | null)[] | undefined,
): TItem[] {
  const seenIds = new Set<string>();
  const items: TItem[] = [];

  for (const item of pages?.flatMap(page => page?.data ?? []) ?? []) {
    if (!item || seenIds.has(item.id)) {
      continue;
    }

    seenIds.add(item.id);
    items.push(item);
  }

  return items;
}
