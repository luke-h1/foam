import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SanitisedEmote } from '@app/types/emote';
import { EMOTE_PROVIDER_BY_SITE } from '@app/utils/emote/emoteProviderBySite';

import { processEmotesWorklet } from '../emoteProcessor';
import type { ParsedPart } from '../parsedPart';
import { clearMentionLoginIndex } from '../resolveMentionLogin/clearMentionLoginIndex';
import { registerMentionLogin } from '../resolveMentionLogin/registerMentionLogin';

const pickFields = (value: unknown, keys: readonly string[]) =>
  Object.fromEntries(
    keys.map(key => [key, (value as Record<string, unknown>)[key]]),
  );

const curtisEmote: SanitisedEmote = {
  id: 'curtis-id',
  name: 'Curtis',
  original_name: 'Curtis',
  creator: null,
  emote_link: 'https://example.com/Curtis',
  site: '7TV Channel',
  provider: '7tv',
  url: 'https://example.com/Curtis.avif',
  frame_count: 1,
  format: 'avif',
  flags: 0,
  aspect_ratio: 1,
  zero_width: false,
  width: 32,
  height: 32,
  set_metadata: {
    setId: 'set-id',
    setName: 'Channel',
    capacity: null,
    ownerId: null,
    kind: EmoteSetKind.Normal,
    updatedAt: '2026-05-11T00:00:00.000Z',
    totalCount: 1,
  },
};

const createEmote = (
  overrides: Partial<SanitisedEmote> & Pick<SanitisedEmote, 'id' | 'name'>,
): SanitisedEmote =>
  ({
    ...curtisEmote,
    emote_link: `https://example.com/${overrides.id}`,
    original_name: overrides.name,
    url: `https://example.com/${overrides.id}.avif`,
    provider: EMOTE_PROVIDER_BY_SITE[overrides.site ?? curtisEmote.site],
    ...overrides,
  }) as SanitisedEmote;

const emptyParams = {
  userstate: null,
  emojiEmotes: [],
  sevenTvGlobalEmotes: [],
  sevenTvChannelEmotes: [],
  sevenTvPersonalEmotes: [],
  twitchGlobalEmotes: [],
  twitchChannelEmotes: [],
  twitchSubscriberEmotes: [],
  ffzChannelEmotes: [],
  ffzGlobalEmotes: [],
  bttvChannelEmotes: [],
  bttvGlobalEmotes: [],
};

describe('processEmotesWorklet', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
  });

  test('parses @mentions as mention parts', () => {
    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'hey @VelvetFathom93 look',
    });

    expect(
      result.map(part => ({
        type: part.type,
        content: 'content' in part ? part.content : undefined,
      })),
    ).toEqual([
      { type: 'text', content: 'hey' },
      { type: 'text', content: ' ' },
      { type: 'mention', content: '@VelvetFathom93' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'look' },
    ]);
  });

  test('rewrites mention casing when canonical login is known', () => {
    registerMentionLogin('VelvetFathom93');

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: '@velvetfathom93 high hopes',
    });

    expect(pickFields(result[0], ['type', 'content'])).toEqual({
      type: 'mention',
      content: '@VelvetFathom93',
    });
  });

  test('does not treat emote names as substrings of @mentions', () => {
    const singleLetterEmote = createEmote({ id: 'letter-o', name: 'o' });
    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: '@VelvetFathom93 high hopes',
      sevenTvChannelEmotes: [singleLetterEmote],
    });

    expect(
      result.map(part => ({
        type: part.type,
        content: 'content' in part ? part.content : undefined,
      })),
    ).toEqual([
      { type: 'mention', content: '@VelvetFathom93' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'high' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'hopes' },
    ]);
  });

  test('keeps @EmoteName as a mention even when EmoteName is an emote', () => {
    const waveEmote = createEmote({ id: 'wave-emote', name: 'Wave' });
    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: '@Wave hello',
      sevenTvChannelEmotes: [waveEmote],
    });

    expect(result.map(part => pickFields(part, ['type', 'content']))).toEqual([
      { type: 'mention', content: '@Wave' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'hello' },
    ]);
  });

  test('matches bare EmoteName as an emote', () => {
    const waveEmote = createEmote({ id: 'wave-emote', name: 'Wave' });
    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'Wave hello',
      sevenTvChannelEmotes: [waveEmote],
    });

    expect(result.map(part => pickFields(part, ['type', 'content']))).toEqual([
      { type: 'emote', content: 'Wave' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'hello' },
    ]);
  });

  test('parses https URLs as purple link parts', () => {
    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'https://tetr.io/#WLBR',
    });

    expect(result).toEqual<ParsedPart[]>([
      {
        type: 'link',
        content: 'https://tetr.io/#WLBR',
        url: 'https://tetr.io/#WLBR',
      },
    ]);
  });

  test('matches emotes case-sensitively', () => {
    const lowerCaseResult = processEmotesWorklet({
      ...emptyParams,
      inputString: 'curtis',
      sevenTvChannelEmotes: [curtisEmote],
    });

    const exactCaseResult = processEmotesWorklet({
      ...emptyParams,
      inputString: 'Curtis',
      sevenTvChannelEmotes: [curtisEmote],
    });

    expect(lowerCaseResult).toEqual<ParsedPart[]>([
      { type: 'text', content: 'curtis' },
    ]);
    expect(pickFields(exactCaseResult[0], ['type', 'name'])).toEqual({
      type: 'emote',
      name: 'Curtis',
    });
  });

  test('matches the channel alias but not the emote original name', () => {
    const aliasedEmote = createEmote({
      id: 'this-emote',
      name: 'This',
      original_name: 'THIS',
    });

    const aliasResult = processEmotesWorklet({
      ...emptyParams,
      inputString: 'This',
      sevenTvChannelEmotes: [aliasedEmote],
    });

    const originalNameResult = processEmotesWorklet({
      ...emptyParams,
      inputString: 'THIS',
      sevenTvChannelEmotes: [aliasedEmote],
    });

    expect(pickFields(aliasResult[0], ['type', 'name'])).toEqual({
      type: 'emote',
      name: 'This',
    });
    expect(originalNameResult).toEqual<ParsedPart[]>([
      { type: 'text', content: 'THIS' },
    ]);
  });

  test('prefers personal and subscriber emotes over base emotes', () => {
    const baseEmote = createEmote({ id: 'base-wave', name: 'Wave' });
    const subscriberEmote = createEmote({
      id: 'subscriber-wave',
      name: 'Wave',
      site: 'Twitch Subscriber',
      provider: 'twitch',
    });
    const personalEmote = createEmote({
      id: 'personal-wave',
      name: 'Wave',
      site: '7TV Personal',
      provider: '7tv',
    });

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'Wave Wave',
      sevenTvChannelEmotes: [baseEmote],
      sevenTvPersonalEmotes: [personalEmote],
      twitchSubscriberEmotes: [subscriberEmote],
    });

    expect(
      result.map(part => ({
        content: 'content' in part ? part.content : undefined,
        id: part.type === 'emote' ? part.id : undefined,
        type: part.type,
      })),
    ).toEqual([
      { content: 'Wave', id: 'personal-wave', type: 'emote' },
      { content: ' ', id: undefined, type: 'text' },
      { content: 'Wave', id: 'personal-wave', type: 'emote' },
    ]);
  });

  test('matches unicode emoji by hexcode', () => {
    const emoji = createEmote({
      id: '1F44B',
      name: ':wave:',
      site: 'Emoji',
      provider: 'emoji',
      emoji_hexcode: '1F44B',
    });

    const result = processEmotesWorklet({
      ...emptyParams,
      emojiEmotes: [emoji],
      inputString: 'hi 👋',
      sevenTvChannelEmotes: [],
    });

    expect(
      result.map(part => ({
        content: 'content' in part ? part.content : undefined,
        original_name: part.type === 'emote' ? part.original_name : undefined,
        type: part.type,
      })),
    ).toEqual([
      { content: 'hi', original_name: undefined, type: 'text' },
      { content: ' ', original_name: undefined, type: 'text' },
      { content: '👋', original_name: '👋', type: 'emote' },
    ]);
  });

  test('falls back to the FE0F-stripped hexcode for standalone emoji', () => {
    const heart = createEmote({
      id: '2764',
      name: ':heart:',
      site: 'Emoji',
      provider: 'emoji',
      emoji_hexcode: '2764',
    });

    const result = processEmotesWorklet({
      ...emptyParams,
      emojiEmotes: [heart],
      inputString: '❤️',
      sevenTvChannelEmotes: [],
    });

    expect(
      result.map(part => ({
        content: 'content' in part ? part.content : undefined,
        id: part.type === 'emote' ? part.id : undefined,
        type: part.type,
      })),
    ).toEqual([{ content: '❤️', id: '2764', type: 'emote' }]);
  });

  test('matches :emoji: shortcode aliases as emotes', () => {
    const joy = createEmote({
      id: '1F602',
      name: ':joy:',
      site: 'Emoji',
      provider: 'emoji',
    });
    const haha = createEmote({
      id: '1F602-haha',
      name: ':haha:',
      site: 'Emoji',
      provider: 'emoji',
    });

    const result = processEmotesWorklet({
      ...emptyParams,
      emojiEmotes: [joy, haha],
      inputString: 'hello :joy: :haha:',
      sevenTvChannelEmotes: [],
    });

    expect(
      result.map(part => ({
        content: 'content' in part ? part.content : undefined,
        name: part.type === 'emote' ? part.name : undefined,
        type: part.type,
      })),
    ).toEqual([
      { content: 'hello', name: undefined, type: 'text' },
      { content: ' ', name: undefined, type: 'text' },
      { content: ':joy:', name: ':joy:', type: 'emote' },
      { content: ' ', name: undefined, type: 'text' },
      { content: ':haha:', name: ':haha:', type: 'emote' },
    ]);
  });

  test('trailing punctuation defeats an emote match', () => {
    const kappa = createEmote({ id: 'kappa-id', name: 'Kappa' });

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'Kappa!',
      sevenTvChannelEmotes: [kappa],
    });

    expect(result).toEqual<ParsedPart[]>([{ type: 'text', content: 'Kappa!' }]);
  });

  test('strips the duplicate-message bypass char fused to an emote name', () => {
    const dogEmote = createEmote({ id: 'dog-emote', name: 'dogE' });
    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'dogE\u034F',
      sevenTvChannelEmotes: [dogEmote],
    });

    expect(
      result.map(part => ({
        type: part.type,
        content: 'content' in part ? part.content : undefined,
      })),
    ).toEqual([{ type: 'emote', content: 'dogE' }]);
  });

  test('drops a trailing bypass char instead of rendering it as a text box', () => {
    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'safe \u034F',
    });

    expect(
      result.map(part => ({
        type: part.type,
        content: 'content' in part ? part.content : undefined,
      })),
    ).toEqual([
      { type: 'text', content: 'safe' },
      { type: 'text', content: ' ' },
    ]);
  });

  test('reuses cached processing results for the same emote collections', () => {
    const params = {
      ...emptyParams,
      inputString: 'Curtis',
      sevenTvChannelEmotes: [curtisEmote],
    };

    const firstResult = processEmotesWorklet(params);
    const secondResult = processEmotesWorklet(params);

    expect(secondResult).toBe(firstResult);
  });

  /**
   * A store update handing over a fresh array of the same emotes must still hit
   * the cache rather than reparse every message.
   */
  test('reuses cached results for a rebuilt scoped emote array', () => {
    const personalEmote = createEmote({
      id: 'personal-rebuilt',
      name: 'Rebuilt',
      site: '7TV Personal',
      provider: '7tv',
    });

    const firstResult = processEmotesWorklet({
      ...emptyParams,
      inputString: 'Rebuilt',
      sevenTvPersonalEmotes: [personalEmote],
    });
    const secondResult = processEmotesWorklet({
      ...emptyParams,
      inputString: 'Rebuilt',
      sevenTvPersonalEmotes: [personalEmote],
    });

    expect(secondResult).toBe(firstResult);
  });

  test('keeps scoped emote cache entries distinct when middle emotes change', () => {
    const firstPersonalEmote = createEmote({
      id: 'personal-first',
      name: 'First',
      site: '7TV Personal',
      provider: '7tv',
    });
    const firstMiddleEmote = createEmote({
      id: 'personal-middle-a',
      name: 'MiddleA',
      site: '7TV Personal',
      provider: '7tv',
    });
    const secondMiddleEmote = createEmote({
      id: 'personal-middle-b',
      name: 'MiddleB',
      site: '7TV Personal',
      provider: '7tv',
    });
    const lastPersonalEmote = createEmote({
      id: 'personal-last',
      name: 'Last',
      site: '7TV Personal',
      provider: '7tv',
    });

    const firstResult = processEmotesWorklet({
      ...emptyParams,
      inputString: 'MiddleA',
      sevenTvPersonalEmotes: [
        firstPersonalEmote,
        firstMiddleEmote,
        lastPersonalEmote,
      ],
    });
    const secondResult = processEmotesWorklet({
      ...emptyParams,
      inputString: 'MiddleA',
      sevenTvPersonalEmotes: [
        firstPersonalEmote,
        secondMiddleEmote,
        lastPersonalEmote,
      ],
    });

    expect(firstResult).toEqual<ParsedPart[]>([
      {
        type: 'emote',
        content: 'MiddleA',
        id: 'personal-middle-a',
        name: 'MiddleA',
        original_name: 'MiddleA',
        creator: '',
        emote_link: 'https://example.com/personal-middle-a',
        url: 'https://example.com/personal-middle-a.avif',
        static_url: undefined,
        thumbnail: 'https://example.com/personal-middle-a.avif',
        site: '7TV Personal',
        aspect_ratio: 1,
        zero_width: false,
        width: 32,
        height: 32,
      },
    ]);
    expect(secondResult).toEqual<ParsedPart[]>([
      { type: 'text', content: 'MiddleA' },
    ]);
  });

  test('attaches consecutive zero-width emotes to the preceding emote as overlays', () => {
    const baseEmote = createEmote({ id: 'base-emote', name: 'peepoHappy' });
    const snowEmote = createEmote({
      id: 'zw-snow',
      name: 'SoSnowy',
      zero_width: true,
    });
    const coldEmote = createEmote({
      id: 'zw-cold',
      name: 'IceCold',
      zero_width: true,
    });

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'peepoHappy SoSnowy IceCold',
      sevenTvChannelEmotes: [baseEmote, snowEmote, coldEmote],
    });

    expect(result).toEqual<ParsedPart[]>([
      {
        type: 'emote',
        content: 'peepoHappy',
        id: 'base-emote',
        name: 'peepoHappy',
        original_name: 'peepoHappy',
        creator: '',
        emote_link: 'https://example.com/base-emote',
        url: 'https://example.com/base-emote.avif',
        static_url: undefined,
        thumbnail: 'https://example.com/base-emote.avif',
        site: '7TV Channel',
        aspect_ratio: 1,
        zero_width: false,
        width: 32,
        height: 32,
        overlaid: [
          {
            type: 'emote',
            content: 'SoSnowy',
            id: 'zw-snow',
            name: 'SoSnowy',
            original_name: 'SoSnowy',
            creator: '',
            emote_link: 'https://example.com/zw-snow',
            url: 'https://example.com/zw-snow.avif',
            static_url: undefined,
            thumbnail: 'https://example.com/zw-snow.avif',
            site: '7TV Channel',
            aspect_ratio: 1,
            zero_width: true,
            width: 32,
            height: 32,
          },
          {
            type: 'emote',
            content: 'IceCold',
            id: 'zw-cold',
            name: 'IceCold',
            original_name: 'IceCold',
            creator: '',
            emote_link: 'https://example.com/zw-cold',
            url: 'https://example.com/zw-cold.avif',
            static_url: undefined,
            thumbnail: 'https://example.com/zw-cold.avif',
            site: '7TV Channel',
            aspect_ratio: 1,
            zero_width: true,
            width: 32,
            height: 32,
          },
        ],
      },
    ]);
  });

  test('keeps a zero-width emote standalone when nothing precedes it', () => {
    const snowEmote = createEmote({
      id: 'zw-snow',
      name: 'SoSnowy',
      zero_width: true,
    });

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'SoSnowy hello',
      sevenTvChannelEmotes: [snowEmote],
    });

    expect(pickFields(result[0], ['id', 'type', 'zero_width'])).toEqual({
      id: 'zw-snow',
      type: 'emote',
      zero_width: true,
    });
  });

  test('hides BTTV backward modifiers before an emote', () => {
    const baseEmote = createEmote({ id: 'base-emote', name: 'peepoHappy' });

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'w! peepoHappy',
      sevenTvChannelEmotes: [baseEmote],
    });

    expect(result.map(part => pickFields(part, ['type', 'content']))).toEqual([
      { type: 'emote', content: 'peepoHappy' },
    ]);
  });

  test('keeps modifier-looking words that do not precede an emote', () => {
    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'w! hello',
    });

    expect(result.map(part => pickFields(part, ['type', 'content']))).toEqual([
      { type: 'text', content: 'w!' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'hello' },
    ]);
  });

  test('hides ffz modifier words after an emote', () => {
    const baseEmote = createEmote({ id: 'base-emote', name: 'peepoHappy' });

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'peepoHappy ffzHyper done',
      sevenTvChannelEmotes: [baseEmote],
    });

    expect(result.map(part => pickFields(part, ['type', 'content']))).toEqual([
      { type: 'emote', content: 'peepoHappy' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'done' },
    ]);
  });
});
