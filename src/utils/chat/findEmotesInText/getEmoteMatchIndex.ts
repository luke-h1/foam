import type { SanitisedEmote } from '@app/types/emote';

export type EmoteMatchEntry = {
  name: string;
  emote: SanitisedEmote;
  isTwitch: boolean;
};

export type EmoteMatchIndex = {
  size: number;
  byFirstChar: Map<string, EmoteMatchEntry[]>;
};

const matchIndexCache = new WeakMap<
  Map<string, SanitisedEmote>,
  EmoteMatchIndex
>();

function isTwitchEmoteSite(site: SanitisedEmote['site']): boolean {
  return (
    site === 'Twitch Global' ||
    site === 'Twitch Channel' ||
    site === 'Twitch Subscriber'
  );
}

function buildEmoteMatchIndex(
  emoteMap: Map<string, SanitisedEmote>,
): EmoteMatchIndex {
  const entries: EmoteMatchEntry[] = [];
  emoteMap.forEach((emote, name) => {
    entries.push({
      name,
      emote,
      isTwitch: isTwitchEmoteSite(emote.site),
    });
  });
  // eslint-disable-next-line react-doctor/js-tosorted-immutable -- local array built above; in-place sort avoids a copy on this hot path
  entries.sort((a, b) => b.name.length - a.name.length);

  const byFirstChar = new Map<string, EmoteMatchEntry[]>();
  for (const entry of entries) {
    const firstChar = entry.name.charAt(0);
    const bucket = byFirstChar.get(firstChar);
    if (bucket) {
      bucket.push(entry);
    } else {
      byFirstChar.set(firstChar, [entry]);
    }
  }

  return { size: emoteMap.size, byFirstChar };
}

/**
 * Longest-first first-char index; cached while map size is unchanged.
 */
export function getEmoteMatchIndex(
  emoteMap: Map<string, SanitisedEmote>,
): EmoteMatchIndex {
  const cached = matchIndexCache.get(emoteMap);
  if (cached && cached.size === emoteMap.size) {
    return cached;
  }

  const index = buildEmoteMatchIndex(emoteMap);
  matchIndexCache.set(emoteMap, index);
  return index;
}
