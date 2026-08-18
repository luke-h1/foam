import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SevenTvSanitisedEmote } from '@app/types/emote';
import { getEmoteArrayContentKey } from '@app/utils/chat/emoteArrayContentKey';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';

function makeEmote(
  overrides: Partial<SevenTvSanitisedEmote> = {},
): SevenTvSanitisedEmote {
  return {
    id: 'emote-1',
    name: 'KEKW',
    original_name: 'KEKW',
    creator: 'creator',
    emote_link: 'https://7tv.app/emotes/emote-1',
    provider: '7tv',
    site: '7TV Channel',
    url: 'https://cdn.7tv.app/emote/emote-1/4x.avif',
    static_url: 'https://cdn.7tv.app/emote/emote-1/4x_static.avif',
    zero_width: false,
    frame_count: 1,
    format: 'AVIF',
    flags: 0,
    aspect_ratio: 1,
    width: 32,
    height: 32,
    set_metadata: {
      capacity: null,
      kind: EmoteSetKind.Normal,
      ownerId: null,
      setId: 'set-id',
      setName: 'channel',
      totalCount: 1,
      updatedAt: '2026-05-19T00:00:00Z',
    },
    ...overrides,
  };
}

describe('getEmoteArrayContentKey', () => {
  test('rebuilt arrays with identical content share a key', () => {
    const a = [makeEmote(), makeEmote({ id: 'emote-2', name: 'PogU' })];
    const b = [makeEmote(), makeEmote({ id: 'emote-2', name: 'PogU' })];

    expect(getEmoteArrayContentKey(a)).toBe(getEmoteArrayContentKey(b));
  });

  test('a field boundary shifted between id and name changes the key', () => {
    const a = [makeEmote({ id: '25', name: 'Kappa' })];
    const b = [makeEmote({ id: '2', name: '5Kappa' })];

    expect(getEmoteArrayContentKey(a)).not.toBe(getEmoteArrayContentKey(b));
  });

  test('a field boundary shifted between name and url changes the key', () => {
    const a = [makeEmote({ name: 'ab', url: 'cd' })];
    const b = [makeEmote({ name: 'abc', url: 'd' })];

    expect(getEmoteArrayContentKey(a)).not.toBe(getEmoteArrayContentKey(b));
  });

  test('an alias sitting where a url would sit changes the key', () => {
    const shared = 'https://cdn.7tv.app/emote/1/2x.webp';
    const aliasOnly = [
      makeEmote({ id: 'x', name: 'n', original_name: shared, url: '' }),
    ];
    const urlOnly = [
      makeEmote({ id: 'x', name: 'n', original_name: 'n', url: shared }),
    ];

    expect(getEmoteArrayContentKey(aliasOnly)).not.toBe(
      getEmoteArrayContentKey(urlOnly),
    );
  });

  test('a renamed emote changes the key', () => {
    const a = [makeEmote()];
    const b = [makeEmote({ name: 'KEKWait' })];

    expect(getEmoteArrayContentKey(a)).not.toBe(getEmoteArrayContentKey(b));
  });

  test('a changed url changes the key', () => {
    const a = [makeEmote()];
    const b = [makeEmote({ url: 'https://cdn.7tv.app/emote/emote-1/2x.avif' })];

    expect(getEmoteArrayContentKey(a)).not.toBe(getEmoteArrayContentKey(b));
  });

  test('a zero-width flip changes the key', () => {
    const a = [makeEmote()];
    const b = [makeEmote({ zero_width: true })];

    expect(getEmoteArrayContentKey(a)).not.toBe(getEmoteArrayContentKey(b));
  });
});

describe('parse cache across emote array identity churn', () => {
  const collections = {
    emojiEmotes: [],
    sevenTvGlobalEmotes: [],
    sevenTvPersonalEmotes: [],
    twitchGlobalEmotes: [],
    twitchChannelEmotes: [],
    twitchSubscriberEmotes: [],
    ffzChannelEmotes: [],
    ffzGlobalEmotes: [],
    bttvChannelEmotes: [],
    bttvGlobalEmotes: [],
  };

  test('a rebuilt channel emote array keeps cached parses warm', () => {
    const first = processEmotesWorklet({
      inputString: 'hello KEKW world',
      userstate: null,
      ...collections,
      sevenTvChannelEmotes: [makeEmote()],
    });

    const second = processEmotesWorklet({
      inputString: 'hello KEKW world',
      userstate: null,
      ...collections,
      sevenTvChannelEmotes: [makeEmote()],
    });

    expect(second).toBe(first);
  });

  test('a genuinely changed emote set re-parses', () => {
    const first = processEmotesWorklet({
      inputString: 'hello PogU world',
      userstate: null,
      ...collections,
      sevenTvChannelEmotes: [makeEmote()],
    });

    const second = processEmotesWorklet({
      inputString: 'hello PogU world',
      userstate: null,
      ...collections,
      sevenTvChannelEmotes: [
        makeEmote(),
        makeEmote({ id: 'emote-2', name: 'PogU' }),
      ],
    });

    expect(second).not.toBe(first);
    expect(second.some(part => part.type === 'emote')).toBe(true);
  });
});
