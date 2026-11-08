import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
import { getChatRowSizeBucket } from '@app/components/chat/util/chatRowSizeBucket';
import {
  createEmoteToken,
  createTextToken,
} from '@app/utils/chat/__tests__/__fixtures__/messageToken.fixture';

describe('getChatRowSizeBucket', () => {
  test('keeps every one-line row in the first bucket', () => {
    expect(getChatRowSizeBucket(createChatMessageFixture())).toBe('w0');

    expect(
      getChatRowSizeBucket(
        createChatMessageFixture({ message: [createTextToken('gg')] }),
      ),
    ).toBe('w0');
  });

  test('climbs a bucket on the character that passes each bound', () => {
    const usernameWeight = 'viewer'.length;

    const buckets = [30, 60, 100, 150, 220, 320, 460, 640].flatMap(bound =>
      [bound - usernameWeight, bound - usernameWeight + 1].map(length =>
        getChatRowSizeBucket(
          createChatMessageFixture({
            message: [createTextToken('a'.repeat(length))],
          }),
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
    const text = createChatMessageFixture({
      message: [createTextToken('hello')],
    });
    const emote = createChatMessageFixture({
      message: [createEmoteToken('Kappa')],
    });

    expect(getChatRowSizeBucket(text)).toBe('w0');

    expect(getChatRowSizeBucket(emote)).toBe('w0e');
  });

  test('climbs a bucket as an emote wall grows', () => {
    const few = createChatMessageFixture({
      message: Array.from({ length: 4 }, () => createEmoteToken('Kappa')),
    });

    const wall = createChatMessageFixture({
      message: Array.from({ length: 12 }, () => createEmoteToken('Kappa')),
    });

    expect(getChatRowSizeBucket(few)).toBe('w0e');

    expect(getChatRowSizeBucket(wall)).toBe('w1e');
  });

  test('weighs the media cards a link renders instead of its url', () => {
    const url = 'https://7tv.app/emotes/01F6MZGCNG000255K4X1V15WQE';

    const stvEmote = createChatMessageFixture({
      message: [{ type: 'stvEmoteLink', content: url, url }],
    });

    const clip = createChatMessageFixture({
      message: [{ type: 'twitchClip', content: url, url }],
    });

    expect(getChatRowSizeBucket(stvEmote)).toBe('w1');

    expect(getChatRowSizeBucket(clip)).toBe('w2');
  });

  test('reads the username but never the badges', () => {
    const withBadges = createChatMessageFixture({
      badges: [
        {
          id: 'moderator',
          set: 'moderator',
          title: 'Moderator',
          type: 'Twitch Global Badge',
          provider: 'twitch',
          url: 'https://example.test/mod.png',
        },
      ],
    });

    expect(getChatRowSizeBucket(withBadges)).toBe(
      getChatRowSizeBucket(createChatMessageFixture()),
    );
  });
});
