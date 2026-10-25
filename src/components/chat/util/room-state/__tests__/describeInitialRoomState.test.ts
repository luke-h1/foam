import { describeInitialRoomState } from '../describeInitialRoomState';
import { emptyRoomState } from './__fixtures__/roomState.fixture';

describe('describeInitialRoomState', () => {
  test('returns null when no modes are active', () => {
    expect(describeInitialRoomState(emptyRoomState)).toBeNull();
  });

  test('describes a single active mode', () => {
    expect(
      describeInitialRoomState({
        ...emptyRoomState,
        emoteOnly: true,
      }),
    ).toBe('Chat modes active: emote-only');
  });

  test('describes multiple active modes', () => {
    expect(
      describeInitialRoomState({
        emoteOnly: true,
        followersOnlyMinutes: 5,
        r9k: true,
        slowSeconds: 30,
        subsOnly: true,
      }),
    ).toBe(
      'Chat modes active: emote-only, subscribers-only, unique-chat, slow mode (30s), followers-only (5m)',
    );
  });

  test('describes zero-minute followers-only separately', () => {
    expect(
      describeInitialRoomState({
        ...emptyRoomState,
        followersOnlyMinutes: 0,
      }),
    ).toBe('Chat modes active: followers-only');
  });
});
