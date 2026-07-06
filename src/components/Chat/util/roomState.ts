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

interface RoomStateModeDefinition {
  getStatus: (state: ParsedRoomState) => RoomStateModeStatus;
  activeSummary: (value: number | undefined) => string;
  enabledNotice: (value: number | undefined) => string;
  disabledNotice: string;
}

/**
 * Single source of truth for the chat modes a room state activates. Table
 * order is the notice order; the join summary and change notices derive from
 * it, so adding a mode is one new entry here.
 */
const ROOM_STATE_MODES = {
  emote: {
    getStatus: state => ({ active: state.emoteOnly }),
    activeSummary: () => 'emote-only',
    enabledNotice: () => 'Emote-only mode enabled',
    disabledNotice: 'Emote-only mode disabled',
  },
  subs: {
    getStatus: state => ({ active: state.subsOnly }),
    activeSummary: () => 'subscribers-only',
    enabledNotice: () => 'Subscribers-only mode enabled',
    disabledNotice: 'Subscribers-only mode disabled',
  },
  unique: {
    getStatus: state => ({ active: state.r9k }),
    activeSummary: () => 'unique-chat',
    enabledNotice: () => 'Unique-chat mode enabled',
    disabledNotice: 'Unique-chat mode disabled',
  },
  slow: {
    getStatus: state => ({
      active: state.slowSeconds > 0,
      value: state.slowSeconds > 0 ? state.slowSeconds : undefined,
    }),
    activeSummary: value => `slow mode (${value}s)`,
    enabledNotice: value => `Slow mode enabled (${value}s)`,
    disabledNotice: 'Slow mode disabled',
  },
  followers: {
    getStatus: state => ({
      active: state.followersOnlyMinutes >= 0,
      value:
        state.followersOnlyMinutes > 0 ? state.followersOnlyMinutes : undefined,
    }),
    activeSummary: value =>
      value === undefined ? 'followers-only' : `followers-only (${value}m)`,
    enabledNotice: value =>
      value === undefined
        ? 'Followers-only mode enabled'
        : `Followers-only mode enabled (${value}m)`,
    disabledNotice: 'Followers-only mode disabled',
  },
} satisfies Record<string, RoomStateModeDefinition>;

type RoomStateModeKey = keyof typeof ROOM_STATE_MODES;

function getModeDefinition(key: RoomStateModeKey): RoomStateModeDefinition {
  return ROOM_STATE_MODES[key];
}

const MODE_KEYS = Object.keys(ROOM_STATE_MODES) as RoomStateModeKey[];

export function describeInitialRoomState(
  state: ParsedRoomState,
): string | null {
  const activeModes = MODE_KEYS.flatMap(key => {
    const mode = getModeDefinition(key);
    const status = mode.getStatus(state);
    return status.active ? [mode.activeSummary(status.value)] : [];
  });

  if (activeModes.length === 0) {
    return null;
  }

  return `Chat modes active: ${activeModes.join(', ')}`;
}

export function describeRoomStateChanges(
  previous: ParsedRoomState,
  next: ParsedRoomState,
): string[] {
  return MODE_KEYS.flatMap(key => {
    const mode = getModeDefinition(key);
    const previousStatus = mode.getStatus(previous);
    const nextStatus = mode.getStatus(next);

    if (
      previousStatus.active === nextStatus.active &&
      previousStatus.value === nextStatus.value
    ) {
      return [];
    }

    return [
      nextStatus.active
        ? mode.enabledNotice(nextStatus.value)
        : mode.disabledNotice,
    ];
  });
}
