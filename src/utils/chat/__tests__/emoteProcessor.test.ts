import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SanitisedEmote } from '@app/types/emote';
import { processEmotesWorklet } from '../emoteProcessor';

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
});
