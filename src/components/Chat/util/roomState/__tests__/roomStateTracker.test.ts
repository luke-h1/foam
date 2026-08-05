import type { ParsedRoomState } from '@app/store/chat/types/roomState';

import {
  createRoomStateTracker,
  type RoomStateUpdate,
} from '../roomStateTracker';

const inactiveTags: Record<string, string> = {
  emote_only: '0',
  'followers-only': '-1',
  r9k: '0',
  slow: '0',
  'subs-only': '0',
};

const emptyRoomState: ParsedRoomState = {
  emoteOnly: false,
  followersOnlyMinutes: -1,
  r9k: false,
  slowSeconds: 0,
  subsOnly: false,
};

describe('createRoomStateTracker', () => {
  test('first ingest summarises every active mode', () => {
    const tracker = createRoomStateTracker();

    expect(
      tracker.ingest({
        ...inactiveTags,
        emote_only: '1',
        'followers-only': '5',
        slow: '30',
      }),
    ).toEqual<RoomStateUpdate>({
      state: {
        emoteOnly: true,
        followersOnlyMinutes: 5,
        r9k: false,
        slowSeconds: 30,
        subsOnly: false,
      },
      notices: [
        'Chat modes active: emote-only, slow mode (30s), followers-only (5m)',
      ],
    });
  });

  test('first ingest with no active modes posts no notice', () => {
    const tracker = createRoomStateTracker();

    expect(tracker.ingest(inactiveTags)).toEqual<RoomStateUpdate>({
      state: emptyRoomState,
      notices: [],
    });
  });

  test('announces slow mode turning on and then off', () => {
    const tracker = createRoomStateTracker();
    tracker.ingest(inactiveTags);

    expect(
      tracker.ingest({ ...inactiveTags, slow: '30' }),
    ).toEqual<RoomStateUpdate>({
      state: { ...emptyRoomState, slowSeconds: 30 },
      notices: ['Slow mode enabled (30s)'],
    });

    expect(tracker.ingest(inactiveTags)).toEqual<RoomStateUpdate>({
      state: emptyRoomState,
      notices: ['Slow mode disabled'],
    });
  });

  test('re-announces slow mode when its duration changes', () => {
    const tracker = createRoomStateTracker();
    tracker.ingest({ ...inactiveTags, slow: '30' });

    expect(
      tracker.ingest({ ...inactiveTags, slow: '60' }),
    ).toEqual<RoomStateUpdate>({
      state: { ...emptyRoomState, slowSeconds: 60 },
      notices: ['Slow mode enabled (60s)'],
    });
  });

  test('announces followers-only with and without a minimum follow age', () => {
    const tracker = createRoomStateTracker();
    tracker.ingest(inactiveTags);

    expect(
      tracker.ingest({ ...inactiveTags, 'followers-only': '0' }),
    ).toEqual<RoomStateUpdate>({
      state: { ...emptyRoomState, followersOnlyMinutes: 0 },
      notices: ['Followers-only mode enabled'],
    });

    expect(
      tracker.ingest({ ...inactiveTags, 'followers-only': '10' }),
    ).toEqual<RoomStateUpdate>({
      state: { ...emptyRoomState, followersOnlyMinutes: 10 },
      notices: ['Followers-only mode enabled (10m)'],
    });

    expect(tracker.ingest(inactiveTags)).toEqual<RoomStateUpdate>({
      state: emptyRoomState,
      notices: ['Followers-only mode disabled'],
    });
  });

  test('announces multiple simultaneous changes in notice order', () => {
    const tracker = createRoomStateTracker();
    tracker.ingest(inactiveTags);

    expect(
      tracker.ingest({
        emote_only: '1',
        'followers-only': '0',
        r9k: '1',
        slow: '5',
        'subs-only': '1',
      }),
    ).toEqual<RoomStateUpdate>({
      state: {
        emoteOnly: true,
        followersOnlyMinutes: 0,
        r9k: true,
        slowSeconds: 5,
        subsOnly: true,
      },
      notices: [
        'Emote-only mode enabled',
        'Subscribers-only mode enabled',
        'Unique-chat mode enabled',
        'Slow mode enabled (5s)',
        'Followers-only mode enabled',
      ],
    });
  });

  test('re-ingesting an identical room state posts nothing', () => {
    const tracker = createRoomStateTracker();
    tracker.ingest({ ...inactiveTags, slow: '30' });

    expect(
      tracker.ingest({ ...inactiveTags, slow: '30' }),
    ).toEqual<RoomStateUpdate>({
      state: { ...emptyRoomState, slowSeconds: 30 },
      notices: [],
    });
  });

  test('reset clears the published state and the diff baseline', () => {
    const tracker = createRoomStateTracker();
    tracker.ingest({ ...inactiveTags, slow: '30' });

    expect(tracker.reset()).toEqual<RoomStateUpdate>({
      state: null,
      notices: [],
    });

    expect(
      tracker.ingest({ ...inactiveTags, slow: '30' }),
    ).toEqual<RoomStateUpdate>({
      state: { ...emptyRoomState, slowSeconds: 30 },
      notices: ['Chat modes active: slow mode (30s)'],
    });
  });
});
