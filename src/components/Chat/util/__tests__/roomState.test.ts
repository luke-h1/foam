import type { ParsedRoomState } from '@app/store/chat/types/roomState';

import {
  describeInitialRoomState,
  describeRoomStateChanges,
  parseRoomStateTags,
  SUPPRESSED_NOTICE_IDS,
} from '../roomState';

const emptyRoomState: ParsedRoomState = {
  emoteOnly: false,
  followersOnlyMinutes: -1,
  r9k: false,
  slowSeconds: 0,
  subsOnly: false,
};

describe('roomState', () => {
  describe('parseRoomStateTags', () => {
    test('parses inactive room state tags', () => {
      expect(
        parseRoomStateTags({
          emote_only: '0',
          'followers-only': '-1',
          r9k: '0',
          slow: '0',
          'subs-only': '0',
        }),
      ).toEqual(emptyRoomState);
    });

    test('parses active room state tags', () => {
      expect(
        parseRoomStateTags({
          emote_only: '1',
          'followers-only': '10',
          r9k: '1',
          slow: '15',
          'subs-only': '1',
        }),
      ).toEqual<ParsedRoomState>({
        emoteOnly: true,
        followersOnlyMinutes: 10,
        r9k: true,
        slowSeconds: 15,
        subsOnly: true,
      });
    });

    test('defaults missing tags to inactive values', () => {
      expect(parseRoomStateTags({})).toEqual(emptyRoomState);
    });

    test('treats invalid numeric tags as safe defaults', () => {
      expect(
        parseRoomStateTags({
          'followers-only': 'not-a-number',
          slow: 'not-a-number',
        }),
      ).toEqual(emptyRoomState);
    });
  });

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

  describe('SUPPRESSED_NOTICE_IDS', () => {
    test('includes room-state and delete success notice ids', () => {
      expect(SUPPRESSED_NOTICE_IDS.has('emote_only_on')).toBe(true);
      expect(SUPPRESSED_NOTICE_IDS.has('slow_on')).toBe(true);
      expect(SUPPRESSED_NOTICE_IDS.has('delete_message_success')).toBe(true);
      expect(SUPPRESSED_NOTICE_IDS.has('msg_banned')).toBe(false);
    });
  });
});
