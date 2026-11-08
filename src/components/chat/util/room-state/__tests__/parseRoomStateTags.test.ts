import type { ParsedRoomState } from '@app/store/chat/types/room-state';

import { parseRoomStateTags } from '../parseRoomStateTags';
import { emptyRoomState } from './__fixtures__/roomState.fixture';

describe('parseRoomStateTags', () => {
  test('parses inactive room state tags', () => {
    expect(
      parseRoomStateTags({
        'emote-only': '0',
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
        'emote-only': '1',
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

  test('returns only the modes present in a partial ROOMSTATE', () => {
    expect(parseRoomStateTags({ 'room-id': '12345', slow: '30' })).toEqual<
      Partial<ParsedRoomState>
    >({ slowSeconds: 30 });
  });

  test('returns no modes when no mode tags are present', () => {
    expect(parseRoomStateTags({})).toEqual<Partial<ParsedRoomState>>({});
  });

  test('treats invalid numeric tags as safe defaults', () => {
    expect(
      parseRoomStateTags({
        'followers-only': 'not-a-number',
        slow: 'not-a-number',
      }),
    ).toEqual<Partial<ParsedRoomState>>({
      followersOnlyMinutes: -1,
      slowSeconds: 0,
    });
  });
});
