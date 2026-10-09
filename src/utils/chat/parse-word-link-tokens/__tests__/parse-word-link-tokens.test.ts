import type { MessageToken } from '@app/utils/chat/message-token';

import { parseWordLinkParts } from '../parse-word-link-tokens';

describe('parseWordLinkParts', () => {
  test('parses generic https URLs as link tokens', () => {
    expect(
      parseWordLinkParts('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toEqual<MessageToken[]>([
      {
        type: 'link',
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    ]);
  });

  test('parses http URLs as link tokens', () => {
    expect(parseWordLinkParts('http://example.com/path')).toEqual<
      MessageToken[]
    >([
      {
        type: 'link',
        content: 'http://example.com/path',
        url: 'http://example.com/path',
      },
    ]);
  });

  test('splits trailing punctuation from URLs', () => {
    expect(parseWordLinkParts('https://youtu.be/abc123,')).toEqual<
      MessageToken[]
    >([
      {
        type: 'link',
        content: 'https://youtu.be/abc123',
        url: 'https://youtu.be/abc123',
      },
      { type: 'text', content: ',' },
    ]);
  });

  test('still parses 7TV emote links as stvEmote tokens', () => {
    expect(
      parseWordLinkParts('https://7tv.app/emotes/64f8a1b0c4b8c8f8f8f8f8f8'),
    ).toEqual<MessageToken[]>([
      {
        type: 'stvEmoteLink',
        content: 'https://7tv.app/emotes/64f8a1b0c4b8c8f8f8f8f8f8',
        url: 'https://7tv.app/emotes/64f8a1b0c4b8c8f8f8f8f8f8',
      },
    ]);
  });

  test('parses 7TV emote links with a v4 ULID as stvEmote tokens', () => {
    expect(
      parseWordLinkParts('https://7tv.app/emotes/01F6MZGCNG000255K4X1V15WQE'),
    ).toEqual<MessageToken[]>([
      {
        type: 'stvEmoteLink',
        content: 'https://7tv.app/emotes/01F6MZGCNG000255K4X1V15WQE',
        url: 'https://7tv.app/emotes/01F6MZGCNG000255K4X1V15WQE',
      },
    ]);
  });

  test.each([
    'https://7tv.app/emotes/foo',
    'https://7tv.app/emotes/64f8a1b0c4b8c8f8f8f8f8f8extra',
  ])('parses a 7TV link with a malformed emote id as a plain link: %s', url => {
    expect(parseWordLinkParts(url)).toEqual<MessageToken[]>([
      { type: 'link', content: url, url },
    ]);
  });

  test('still parses Twitch clip links as twitchClip tokens', () => {
    expect(parseWordLinkParts('https://clips.twitch.tv/CoolClipSlug')).toEqual<
      MessageToken[]
    >([
      {
        type: 'twitchClip',
        content: 'https://clips.twitch.tv/CoolClipSlug',
        url: 'https://clips.twitch.tv/CoolClipSlug',
      },
    ]);
  });

  test('returns null for non-url words', () => {
    expect(parseWordLinkParts('hello')).toBeNull();
    expect(parseWordLinkParts('www.youtube.com')).toBeNull();
  });
});
