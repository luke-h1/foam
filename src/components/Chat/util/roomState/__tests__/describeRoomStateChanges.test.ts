import { describeRoomStateChanges } from '../describeRoomStateChanges';
import { emptyRoomState } from './__fixtures__/roomState.fixture';

describe('describeRoomStateChanges', () => {
  test('returns an empty array when nothing changed', () => {
    expect(describeRoomStateChanges(emptyRoomState, emptyRoomState)).toEqual(
      [],
    );
  });

  test('describes emote-only toggles', () => {
    expect(
      describeRoomStateChanges(emptyRoomState, {
        ...emptyRoomState,
        emoteOnly: true,
      }),
    ).toEqual(['Emote-only mode enabled']);

    expect(
      describeRoomStateChanges(
        { ...emptyRoomState, emoteOnly: true },
        emptyRoomState,
      ),
    ).toEqual(['Emote-only mode disabled']);
  });

  test('describes subscribers-only toggles', () => {
    expect(
      describeRoomStateChanges(emptyRoomState, {
        ...emptyRoomState,
        subsOnly: true,
      }),
    ).toEqual(['Subscribers-only mode enabled']);
  });

  test('describes unique-chat toggles', () => {
    expect(
      describeRoomStateChanges(emptyRoomState, {
        ...emptyRoomState,
        r9k: true,
      }),
    ).toEqual(['Unique-chat mode enabled']);
  });

  test('describes slow mode changes', () => {
    expect(
      describeRoomStateChanges(emptyRoomState, {
        ...emptyRoomState,
        slowSeconds: 20,
      }),
    ).toEqual(['Slow mode enabled (20s)']);

    expect(
      describeRoomStateChanges(
        { ...emptyRoomState, slowSeconds: 20 },
        emptyRoomState,
      ),
    ).toEqual(['Slow mode disabled']);
  });

  test('describes followers-only changes', () => {
    expect(
      describeRoomStateChanges(emptyRoomState, {
        ...emptyRoomState,
        followersOnlyMinutes: 0,
      }),
    ).toEqual(['Followers-only mode enabled']);

    expect(
      describeRoomStateChanges(emptyRoomState, {
        ...emptyRoomState,
        followersOnlyMinutes: 10,
      }),
    ).toEqual(['Followers-only mode enabled (10m)']);

    expect(
      describeRoomStateChanges(
        { ...emptyRoomState, followersOnlyMinutes: 10 },
        emptyRoomState,
      ),
    ).toEqual(['Followers-only mode disabled']);
  });

  test('combines multiple changes in order', () => {
    expect(
      describeRoomStateChanges(emptyRoomState, {
        emoteOnly: true,
        followersOnlyMinutes: 0,
        r9k: true,
        slowSeconds: 5,
        subsOnly: true,
      }),
    ).toEqual([
      'Emote-only mode enabled',
      'Subscribers-only mode enabled',
      'Unique-chat mode enabled',
      'Slow mode enabled (5s)',
      'Followers-only mode enabled',
    ]);
  });
});
