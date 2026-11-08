import type { RoomStateModeDefinition } from '@app/components/chat/util/room-state/types';

export const ROOM_STATE_MODES = {
  emote: {
    getStatus: state => ({ active: state.emoteOnly }),
    activeSummary: () => 'emote-only',
    enabledNotice: () => 'Emote-only mode enabled',
    disabledNotice: 'Emote-only mode disabled',
    noticeIds: ['emote_only_on', 'emote_only_off'],
  },
  subs: {
    getStatus: state => ({ active: state.subsOnly }),
    activeSummary: () => 'subscribers-only',
    enabledNotice: () => 'Subscribers-only mode enabled',
    disabledNotice: 'Subscribers-only mode disabled',
    noticeIds: ['subs_on', 'subs_off'],
  },
  unique: {
    getStatus: state => ({ active: state.r9k }),
    activeSummary: () => 'unique-chat',
    enabledNotice: () => 'Unique-chat mode enabled',
    disabledNotice: 'Unique-chat mode disabled',
    noticeIds: ['r9k_on', 'r9k_off'],
  },
  slow: {
    getStatus: state => ({
      active: state.slowSeconds > 0,
      value: state.slowSeconds > 0 ? state.slowSeconds : undefined,
    }),
    activeSummary: value => `slow mode (${value}s)`,
    enabledNotice: value => `Slow mode enabled (${value}s)`,
    disabledNotice: 'Slow mode disabled',
    noticeIds: ['slow_on', 'slow_off'],
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
    noticeIds: ['followers_on', 'followers_on_zero', 'followers_off'],
  },
} satisfies Record<string, RoomStateModeDefinition>;

export type RoomStateModeKey = keyof typeof ROOM_STATE_MODES;
