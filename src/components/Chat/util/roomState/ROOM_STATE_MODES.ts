import type { RoomStateModeDefinition } from '@app/components/Chat/util/roomState/types';

/**
 * Single source of truth for the chat modes a room state activates. Table
 * order is the notice order; the join summary and change notices derive from
 * it, so adding a mode is one new entry here.
 */
export const ROOM_STATE_MODES = {
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

export type RoomStateModeKey = keyof typeof ROOM_STATE_MODES;
