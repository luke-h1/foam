import type { SanitisedEmote } from '@app/types/emote';

export function getSortedEmoteNames(
  emoteMap: Map<string, SanitisedEmote>,
): string[] {
  return Array.from(emoteMap.keys()).sort((a, b) => b.length - a.length);
}
