import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SanitisedEmote } from '@app/types/emote';

import { processEmotesWorklet } from '../emoteProcessor';
import {
  clearMentionLoginIndex,
  registerMentionLogin,
} from '../resolveMentionLogin';

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
): SanitisedEmote => ({
  ...curtisEmote,
  emote_link: `https://example.com/${overrides.id}`,
  original_name: overrides.name,
  url: `https://example.com/${overrides.id}.avif`,
  ...overrides,
});

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
      inputString: 'hey @BungleXO look',
    });

    expect(
      result.map(part => ({
        type: part.type,
        content: 'content' in part ? part.content : undefined,
      })),
    ).toEqual([
      { type: 'text', content: 'hey' },
      { type: 'text', content: ' ' },
      { type: 'mention', content: '@BungleXO' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'look' },
    ]);
  });

  test('rewrites mention casing when canonical login is known', () => {
    registerMentionLogin('BungleXO');

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: '@bunglexo high hopes',
    });

    expect(pickFields(result[0], ['type', 'content'])).toEqual({
      type: 'mention',
      content: '@BungleXO',
    });
  });

  test('does not treat emote names as substrings of @mentions', () => {
    const singleLetterEmote = createEmote({ id: 'letter-o', name: 'o' });
    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: '@BungleXO high hopes',
      sevenTvChannelEmotes: [singleLetterEmote],
    });

    expect(
      result.map(part => ({
        type: part.type,
        content: 'content' in part ? part.content : undefined,
      })),
    ).toEqual([
      { type: 'mention', content: '@BungleXO' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'high' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'hopes' },
    ]);
  });

  test('renders @EmoteName as emote when the mention matches the emote name', () => {
    const waveEmote = createEmote({ id: 'wave-emote', name: 'Wave' });
    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: '@Wave hello',
      sevenTvChannelEmotes: [waveEmote],
    });

    expect(pickFields(result[0], ['type', 'name', 'content'])).toEqual({
      type: 'emote',
      name: 'Wave',
      content: 'Wave',
    });
    expect(pickFields(result[1], ['type', 'content'])).toEqual({
      type: 'mention',
      content: '@Wave',
    });
  });

  test('parses https URLs as purple link parts', () => {
    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'https://tetr.io/#WLBR',
    });

    expect(result).toEqual([
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

    expect(lowerCaseResult).toEqual([{ type: 'text', content: 'curtis' }]);
    expect(pickFields(exactCaseResult[0], ['type', 'name'])).toEqual({
      type: 'emote',
      name: 'Curtis',
    });
  });

  test('prefers personal and subscriber emotes over base emotes', () => {
    const baseEmote = createEmote({ id: 'base-wave', name: 'Wave' });
    const subscriberEmote = createEmote({
      id: 'subscriber-wave',
      name: 'Wave',
      site: 'Twitch Subscriber',
    });
    const personalEmote = createEmote({
      id: 'personal-wave',
      name: 'Wave',
      site: '7TV Personal',
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

  test('keeps scoped emote cache entries distinct when middle emotes change', () => {
    const firstPersonalEmote = createEmote({
      id: 'personal-first',
      name: 'First',
      site: '7TV Personal',
    });
    const firstMiddleEmote = createEmote({
      id: 'personal-middle-a',
      name: 'MiddleA',
      site: '7TV Personal',
    });
    const secondMiddleEmote = createEmote({
      id: 'personal-middle-b',
      name: 'MiddleB',
      site: '7TV Personal',
    });
    const lastPersonalEmote = createEmote({
      id: 'personal-last',
      name: 'Last',
      site: '7TV Personal',
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

    expect(pickFields(firstResult[0], ['id', 'type'])).toEqual({
      id: 'personal-middle-a',
      type: 'emote',
    });
    expect(secondResult).toEqual([{ type: 'text', content: 'MiddleA' }]);
  });
});
