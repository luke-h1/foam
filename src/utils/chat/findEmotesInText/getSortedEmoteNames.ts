import type { SanitisedEmote } from '@app/types/emote';

type SortedEmoteNamesCache = {
  size: number;
  names: string[];
};

const sortedEmoteNamesCache = new WeakMap<
  Map<string, SanitisedEmote>,
  SortedEmoteNamesCache
>();

/**
 * Longest-first emote names for greedy matching. Cached per map identity while
 * `size` is unchanged so dense repeated scans (and multi-word parse passes)
 * skip re-sorting.
 */
export function getSortedEmoteNames(
  emoteMap: Map<string, SanitisedEmote>,
): string[] {
  const cached = sortedEmoteNamesCache.get(emoteMap);
  if (cached && cached.size === emoteMap.size) {
    return cached.names;
  }

  const names = Array.from(emoteMap.keys()).sort((a, b) => b.length - a.length);
  sortedEmoteNamesCache.set(emoteMap, { size: emoteMap.size, names });
  return names;
}
