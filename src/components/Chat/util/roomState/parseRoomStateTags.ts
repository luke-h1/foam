import type { ParsedRoomState } from '@app/store/chat/types/roomState';

export function parseRoomStateTags(
  tags: Record<string, string>,
): ParsedRoomState {
  const followersOnlyRaw = Number.parseInt(tags['followers-only'] ?? '-1', 10);
  const slowRaw = Number.parseInt(tags.slow ?? '0', 10);

  return {
    emoteOnly: tags.emote_only === '1',
    followersOnlyMinutes: Number.isNaN(followersOnlyRaw)
      ? -1
      : followersOnlyRaw,
    r9k: tags.r9k === '1',
    slowSeconds: Number.isNaN(slowRaw) ? 0 : slowRaw,
    subsOnly: tags['subs-only'] === '1',
  };
}
