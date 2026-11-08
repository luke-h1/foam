import {
  createRoomStateTracker,
  type RoomStateUpdate,
} from '../roomStateTracker';
import { emptyRoomState } from './__fixtures__/roomState.fixture';

const inactiveTags = {
  'emote-only': '0',
  'followers-only': '-1',
  r9k: '0',
  slow: '0',
  'subs-only': '0',
} satisfies Record<string, string>;

describe('createRoomStateTracker', () => {
  test('first ingest summarises every active mode', () => {
    const tracker = createRoomStateTracker();

    expect(
      tracker.ingest({
        ...inactiveTags,
        'emote-only': '1',
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

  test('a single-tag ROOMSTATE keeps the other modes and posts no false disabled notice', () => {
    const tracker = createRoomStateTracker();
    tracker.ingest({ ...inactiveTags, 'emote-only': '1', 'subs-only': '1' });

    expect(
      tracker.ingest({ 'room-id': '12345', slow: '10' }),
    ).toEqual<RoomStateUpdate>({
      state: {
        ...emptyRoomState,
        emoteOnly: true,
        slowSeconds: 10,
        subsOnly: true,
      },
      notices: ['Slow mode enabled (10s)'],
    });
  });

  test('a first ingest with a partial ROOMSTATE fills the other modes as inactive', () => {
    const tracker = createRoomStateTracker();

    expect(tracker.ingest({ r9k: '1' })).toEqual<RoomStateUpdate>({
      state: { ...emptyRoomState, r9k: true },
      notices: ['Chat modes active: unique-chat'],
    });
  });
});
