import { createSevenTvEmote } from '@app/components/chat/__tests__/__fixtures__/chatFactories.fixture';
import type { MessageToken } from '@app/types/chat/messageToken';

import { processEmotes } from '../emoteProcessor';

const emotePart = (token: MessageToken | undefined): MessageToken<'emote'> => {
  if (token?.type !== 'emote') {
    throw new Error(
      `expected an emote token, received ${token?.type ?? 'none'}`,
    );
  }

  return token;
};

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

describe('processEmotes zero-width overlays', () => {
  test('does not stack the same zero-width emote twice in a row', () => {
    const peepoHappy = createSevenTvEmote({
      id: 'base-emote',
      name: 'peepoHappy',
      original_name: 'peepoHappy',
    });

    const soSnowy = createSevenTvEmote({
      id: 'zw-snow',
      name: 'SoSnowy',
      zero_width: true,
      original_name: 'SoSnowy',
    });

    const result = processEmotes({
      ...emptyParams,
      inputString: 'peepoHappy SoSnowy SoSnowy',
      sevenTvChannelEmotes: [peepoHappy, soSnowy],
    });

    expect(result).toHaveLength(1);
    const base = emotePart(result[0]);
    expect(base.id).toBe('base-emote');

    // The duplicate SoSnowy is consumed, not stacked a second time.
    expect((base.overlaid ?? []).map(overlay => overlay.id)).toEqual([
      'zw-snow',
    ]);
  });

  test('consumes every duplicate in a three-in-a-row zero-width run', () => {
    const peepoHappy = createSevenTvEmote({
      id: 'base-emote',
      name: 'peepoHappy',
      original_name: 'peepoHappy',
    });

    const soSnowy = createSevenTvEmote({
      id: 'zw-snow',
      name: 'SoSnowy',
      zero_width: true,
      original_name: 'SoSnowy',
    });

    const result = processEmotes({
      ...emptyParams,
      inputString: 'peepoHappy SoSnowy SoSnowy SoSnowy',
      sevenTvChannelEmotes: [peepoHappy, soSnowy],
    });

    expect(result).toHaveLength(1);
    const base = emotePart(result[0]);

    expect((base.overlaid ?? []).map(overlay => overlay.id)).toEqual([
      'zw-snow',
    ]);
  });

  test('consumes a duplicate zero-width emote separated by another overlay', () => {
    const peepoHappy = createSevenTvEmote({
      id: 'base-emote',
      name: 'peepoHappy',
      original_name: 'peepoHappy',
    });

    const soSnowy = createSevenTvEmote({
      id: 'zw-snow',
      name: 'SoSnowy',
      zero_width: true,
      original_name: 'SoSnowy',
    });

    const iceCold = createSevenTvEmote({
      id: 'zw-cold',
      name: 'IceCold',
      zero_width: true,
      original_name: 'IceCold',
    });

    const result = processEmotes({
      ...emptyParams,
      inputString: 'peepoHappy SoSnowy IceCold SoSnowy',
      sevenTvChannelEmotes: [peepoHappy, soSnowy, iceCold],
    });

    expect(result).toHaveLength(1);
    const base = emotePart(result[0]);

    expect((base.overlaid ?? []).map(overlay => overlay.id)).toEqual([
      'zw-snow',
      'zw-cold',
    ]);
  });
});
