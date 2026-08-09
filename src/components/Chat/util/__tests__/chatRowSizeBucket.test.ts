import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import {
  createEmotePart,
  createTextPart,
} from '@app/utils/chat/__tests__/__fixtures__/parsedPart.fixture';

import { getChatRowSizeBucket } from '../chatRowSizeBucket';

function createMessage(
  overrides: Partial<AnyChatMessageType> = {},
): AnyChatMessageType {
  return {
    id: 'msg-1',
    message_id: 'msg-1',
    message_nonce: 'nonce-1',
    channel: 'channel',
    sender: 'viewer',
    message: [createTextPart('hello')],
    userstate: createUserStateTags({
      username: 'viewer',
      'display-name': 'Viewer',
      'user-id': '123',
    }),
    badges: [],
    replyBody: '',
    replyDisplayName: '',
    parentDisplayName: '',
    ...overrides,
  };
}

describe('getChatRowSizeBucket', () => {
  test('keeps every one-line row in the first bucket', () => {
    expect(getChatRowSizeBucket(createMessage())).toBe('w0');
    expect(
      getChatRowSizeBucket(createMessage({ message: [createTextPart('gg')] })),
    ).toBe('w0');
  });

  test('climbs a bucket on the character that passes each bound', () => {
    const usernameWeight = 'viewer'.length;
    const buckets = [30, 60, 100, 150, 220, 320, 460, 640].flatMap(bound =>
      [bound - usernameWeight, bound - usernameWeight + 1].map(length =>
        getChatRowSizeBucket(
          createMessage({ message: [createTextPart('a'.repeat(length))] }),
        ),
      ),
    );

    expect(buckets).toEqual<string[]>([
      'w0',
      'w1',
      'w1',
      'w2',
      'w2',
      'w3',
      'w3',
      'w4',
      'w4',
      'w5',
      'w5',
      'w6',
      'w6',
      'w7',
      'w7',
      'w8',
    ]);
  });

  test('separates emote rows from text rows of the same width', () => {
    const text = createMessage({ message: [createTextPart('hello')] });
    const emote = createMessage({ message: [createEmotePart('Kappa')] });

    expect(getChatRowSizeBucket(text)).toBe('w0');
    expect(getChatRowSizeBucket(emote)).toBe('w0e');
  });

  test('climbs a bucket as an emote wall grows', () => {
    const few = createMessage({
      message: Array.from({ length: 4 }, () => createEmotePart('Kappa')),
    });
    const wall = createMessage({
      message: Array.from({ length: 12 }, () => createEmotePart('Kappa')),
    });

    expect(getChatRowSizeBucket(few)).toBe('w0e');
    expect(getChatRowSizeBucket(wall)).toBe('w1e');
  });

  test('weighs the media cards a link renders instead of its url', () => {
    const url = 'https://7tv.app/emotes/01F6MZGCNG000255K4X1V15WQE';
    const stvEmote = createMessage({
      message: [{ type: 'stvEmote', content: url, url }],
    });
    const clip = createMessage({
      message: [{ type: 'twitchClip', content: url, url }],
    });

    expect(getChatRowSizeBucket(stvEmote)).toBe('w1');
    expect(getChatRowSizeBucket(clip)).toBe('w2');
  });

  test('reads the username but never the badges', () => {
    const withBadges = createMessage({
      badges: [
        {
          id: 'moderator',
          set: 'moderator',
          title: 'Moderator',
          type: 'Twitch Global Badge',
          url: 'https://example.test/mod.png',
        },
      ],
    });

    expect(getChatRowSizeBucket(withBadges)).toBe(
      getChatRowSizeBucket(createMessage()),
    );
  });
});
