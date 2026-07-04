import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { parseWordLinkParts } from '../replaceTextWithEmotes';

describe('parseWordLinkParts', () => {
  test('parses generic https URLs as link parts', () => {
    expect(
      parseWordLinkParts('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toEqual<ParsedPart[]>([
      {
        type: 'link',
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    ]);
  });

  test('parses http URLs as link parts', () => {
    expect(parseWordLinkParts('http://example.com/path')).toEqual<ParsedPart[]>(
      [
        {
          type: 'link',
          content: 'http://example.com/path',
          url: 'http://example.com/path',
        },
      ],
    );
  });

  test('splits trailing punctuation from URLs', () => {
    expect(parseWordLinkParts('https://youtu.be/abc123,')).toEqual<
      ParsedPart[]
    >([
      {
        type: 'link',
        content: 'https://youtu.be/abc123',
        url: 'https://youtu.be/abc123',
      },
      { type: 'text', content: ',' },
    ]);
  });

  test('still parses 7TV emote links as stvEmote parts', () => {
    expect(
      parseWordLinkParts('https://7tv.app/emotes/64f8a1b0c4b8c8f8f8f8f8f8'),
    ).toEqual<ParsedPart[]>([
      {
        type: 'stvEmote',
        content: 'https://7tv.app/emotes/64f8a1b0c4b8c8f8f8f8f8f8',
        url: 'https://7tv.app/emotes/64f8a1b0c4b8c8f8f8f8f8f8',
      },
    ]);
  });

  test('still parses Twitch clip links as twitchClip parts', () => {
    expect(parseWordLinkParts('https://clips.twitch.tv/CoolClipSlug')).toEqual<
      ParsedPart[]
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
