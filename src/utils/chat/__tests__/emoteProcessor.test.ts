import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SanitisedEmote } from '@app/types/emote';
import {
  processEmotesOnChatRuntime,
  processEmotesOnChatRuntimeSync,
  processEmotesWorklet,
} from '../emoteProcessor';

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
    expect(exactCaseResult[0]).toMatchObject({
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

    expect(result).toEqual([
      expect.objectContaining({
        type: 'emote',
        id: 'personal-wave',
      }),
      { type: 'text', content: ' ' },
      expect.objectContaining({
        type: 'emote',
        id: 'personal-wave',
      }),
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

    expect(result).toEqual([
      { type: 'text', content: 'hi' },
      { type: 'text', content: ' ' },
      expect.objectContaining({
        type: 'emote',
        content: '👋',
        original_name: '👋',
      }),
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

  test('processes through chat runtime wrappers', async () => {
    const params = {
      ...emptyParams,
      inputString: 'Curtis',
      sevenTvChannelEmotes: [curtisEmote],
    };

    await expect(processEmotesOnChatRuntime(params)).resolves.toEqual([
      expect.objectContaining({
        type: 'emote',
        name: 'Curtis',
      }),
    ]);
    expect(processEmotesOnChatRuntimeSync(params)).toEqual([
      expect.objectContaining({
        type: 'emote',
        name: 'Curtis',
      }),
    ]);
  });
});
