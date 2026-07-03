import type { ParsedRoomState } from '@app/store/chat/types/roomState';

const ROOMSTATE_NOTICE_IDS = new Set([
  'emote_only_off',
  'emote_only_on',
  'followers_off',
  'followers_on',
  'followers_on_zero',
  'slow_off',
  'slow_on',
  'subs_off',
  'subs_on',
]);

export const SUPPRESSED_NOTICE_IDS = new Set([
  ...ROOMSTATE_NOTICE_IDS,
  'delete_message_success',
]);

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

interface RoomStateModeStatus {
  active: boolean;
  /**
   * Slow-mode seconds or followers-only minutes; undefined for plain on/off
   * modes and for followers-only with no minimum follow age.
   */
  value?: number;
}

type RoomStateModeKey = 'emote' | 'subs' | 'unique' | 'slow' | 'followers';

/**
 * Single source of truth for which chat modes a room state activates, so the
 * connect notice, change notifications, and composer chips cannot drift.
 */
function getRoomStateModes(
  state: ParsedRoomState,
): Record<RoomStateModeKey, RoomStateModeStatus> {
  return {
    emote: { active: state.emoteOnly },
    subs: { active: state.subsOnly },
    unique: { active: state.r9k },
    slow: {
      active: state.slowSeconds > 0,
      value: state.slowSeconds > 0 ? state.slowSeconds : undefined,
    },
    followers: {
      active: state.followersOnlyMinutes >= 0,
      value:
        state.followersOnlyMinutes > 0 ? state.followersOnlyMinutes : undefined,
    },
  };
}

export function describeInitialRoomState(
  state: ParsedRoomState,
): string | null {
  const modes = getRoomStateModes(state);
  const activeModes: string[] = [];

  if (modes.emote.active) {
    activeModes.push('emote-only');
  }
  if (modes.subs.active) {
    activeModes.push('subscribers-only');
  }
  if (modes.unique.active) {
    activeModes.push('unique-chat');
  }
  if (modes.slow.active) {
    activeModes.push(`slow mode (${modes.slow.value}s)`);
  }
  if (modes.followers.active) {
    activeModes.push(
      modes.followers.value === undefined
        ? 'followers-only'
        : `followers-only (${modes.followers.value}m)`,
    );
  }

  if (activeModes.length === 0) {
    return null;
  }

  return `Chat modes active: ${activeModes.join(', ')}`;
}

export function describeRoomStateChanges(
  previous: ParsedRoomState,
  next: ParsedRoomState,
): string[] {
  const previousModes = getRoomStateModes(previous);
  const nextModes = getRoomStateModes(next);
  const changes: string[] = [];

  const changed = (key: RoomStateModeKey): boolean =>
    previousModes[key].active !== nextModes[key].active ||
    previousModes[key].value !== nextModes[key].value;

  if (changed('emote')) {
    changes.push(
      nextModes.emote.active
        ? 'Emote-only mode enabled'
        : 'Emote-only mode disabled',
    );
  }

  if (changed('subs')) {
    changes.push(
      nextModes.subs.active
        ? 'Subscribers-only mode enabled'
        : 'Subscribers-only mode disabled',
    );
  }

  if (changed('unique')) {
    changes.push(
      nextModes.unique.active
        ? 'Unique-chat mode enabled'
        : 'Unique-chat mode disabled',
    );
  }

  if (changed('slow')) {
    changes.push(
      nextModes.slow.active
        ? `Slow mode enabled (${nextModes.slow.value}s)`
        : 'Slow mode disabled',
    );
  }

  if (changed('followers')) {
    if (!nextModes.followers.active) {
      changes.push('Followers-only mode disabled');
    } else if (nextModes.followers.value === undefined) {
      changes.push('Followers-only mode enabled');
    } else {
      changes.push(
        `Followers-only mode enabled (${nextModes.followers.value}m)`,
      );
    }
  }

  return changes;
}

export interface RoomStateChip {
  key: string;
  label: string;
}

/**
 * Compact chip labels for the active chat modes, shown above the composer.
 * Inactive modes produce no chip.
 */
export function buildRoomStateChips(state: ParsedRoomState): RoomStateChip[] {
  const modes = getRoomStateModes(state);
  const chips: RoomStateChip[] = [];

  if (modes.slow.active) {
    chips.push({ key: 'slow', label: `Slow ${modes.slow.value}s` });
  }
  if (modes.followers.active) {
    chips.push({
      key: 'followers',
      label:
        modes.followers.value === undefined
          ? 'Followers-only'
          : `Followers-only ${modes.followers.value}m`,
    });
  }
  if (modes.emote.active) {
    chips.push({ key: 'emote', label: 'Emote-only' });
  }
  if (modes.subs.active) {
    chips.push({ key: 'subs', label: 'Sub-only' });
  }
  if (modes.unique.active) {
    chips.push({ key: 'unique', label: 'Unique' });
  }

  return chips;
}
