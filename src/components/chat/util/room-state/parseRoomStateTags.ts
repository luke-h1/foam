import type { ParsedRoomState } from '@app/store/chat/types/room-state';

function parseIntTag(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function parseRoomStateTags(
  tags: Record<string, string>,
): Partial<ParsedRoomState> {
  const state: Partial<ParsedRoomState> = {};
  const emoteOnly = tags['emote-only'];
  const followersOnly = tags['followers-only'];
  const r9k = tags['r9k'];
  const slow = tags['slow'];
  const subsOnly = tags['subs-only'];

  if (emoteOnly !== undefined) {
    state.emoteOnly = emoteOnly === '1';
  }

  if (followersOnly !== undefined) {
    state.followersOnlyMinutes = parseIntTag(followersOnly, -1);
  }

  if (r9k !== undefined) {
    state.r9k = r9k === '1';
  }

  if (slow !== undefined) {
    state.slowSeconds = parseIntTag(slow, 0);
  }

  if (subsOnly !== undefined) {
    state.subsOnly = subsOnly === '1';
  }

  return state;
}
