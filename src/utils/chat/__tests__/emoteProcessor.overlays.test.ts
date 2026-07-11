import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SanitisedEmote } from '@app/types/emote';

import { processEmotesWorklet } from '../emoteProcessor';
import type { ParsedPart } from '../parsedPart';

const baseEmote: SanitisedEmote = {
  id: 'base-id',
  name: 'base',
  original_name: 'base',
  creator: null,
  emote_link: 'https://example.com/base',
  site: '7TV Channel',
  url: 'https://example.com/base.avif',
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
  ...baseEmote,
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

describe('processEmotesWorklet zero-width overlays', () => {
  test('does not stack the same zero-width emote twice in a row', () => {
    const peepoHappy = createEmote({ id: 'base-emote', name: 'peepoHappy' });
    const soSnowy = createEmote({
      id: 'zw-snow',
      name: 'SoSnowy',
      zero_width: true,
    });

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'peepoHappy SoSnowy SoSnowy',
      sevenTvChannelEmotes: [peepoHappy, soSnowy],
    });

    expect(result).toHaveLength(1);
    const base = result[0] as ParsedPart<'emote'>;
    expect(base.id).toBe('base-emote');
    // The duplicate SoSnowy is consumed, not stacked a second time.
    expect((base.overlaid ?? []).map(overlay => overlay.id)).toEqual([
      'zw-snow',
    ]);
  });

  test('consumes every duplicate in a three-in-a-row zero-width run', () => {
    const peepoHappy = createEmote({ id: 'base-emote', name: 'peepoHappy' });
    const soSnowy = createEmote({
      id: 'zw-snow',
      name: 'SoSnowy',
      zero_width: true,
    });

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'peepoHappy SoSnowy SoSnowy SoSnowy',
      sevenTvChannelEmotes: [peepoHappy, soSnowy],
    });

    expect(result).toHaveLength(1);
    const base = result[0] as ParsedPart<'emote'>;
    expect((base.overlaid ?? []).map(overlay => overlay.id)).toEqual([
      'zw-snow',
    ]);
  });

  test('consumes a duplicate zero-width emote separated by another overlay', () => {
    const peepoHappy = createEmote({ id: 'base-emote', name: 'peepoHappy' });
    const soSnowy = createEmote({
      id: 'zw-snow',
      name: 'SoSnowy',
      zero_width: true,
    });
    const iceCold = createEmote({
      id: 'zw-cold',
      name: 'IceCold',
      zero_width: true,
    });

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'peepoHappy SoSnowy IceCold SoSnowy',
      sevenTvChannelEmotes: [peepoHappy, soSnowy, iceCold],
    });

    expect(result).toHaveLength(1);
    const base = result[0] as ParsedPart<'emote'>;
    expect((base.overlaid ?? []).map(overlay => overlay.id)).toEqual([
      'zw-snow',
      'zw-cold',
    ]);
  });

  test('stacks distinct zero-width emotes onto the preceding base emote', () => {
    const peepoHappy = createEmote({ id: 'base-emote', name: 'peepoHappy' });
    const soSnowy = createEmote({
      id: 'zw-snow',
      name: 'SoSnowy',
      zero_width: true,
    });
    const iceCold = createEmote({
      id: 'zw-cold',
      name: 'IceCold',
      zero_width: true,
    });

    const result = processEmotesWorklet({
      ...emptyParams,
      inputString: 'peepoHappy SoSnowy IceCold',
      sevenTvChannelEmotes: [peepoHappy, soSnowy, iceCold],
    });

    expect(result).toHaveLength(1);
    const base = result[0] as ParsedPart<'emote'>;
    expect((base.overlaid ?? []).map(overlay => overlay.id)).toEqual([
      'zw-snow',
      'zw-cold',
    ]);
  });
});
