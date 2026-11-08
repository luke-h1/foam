import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';

import { getMediaLinkCardContent } from '../getMediaLinkCardContent';

describe('getMediaLinkCardContent', () => {
  test('builds a 7TV emote thumbnail that the CDN parser accepts', () => {
    const { thumbnail } = getMediaLinkCardContent({
      fallbackThumbnail: undefined,
      sevenTvEmote: {
        id: '01F6MZGCMR000F9PFB2X8E0V0V',
        name: 'peepoHey',
        owner: null,
      },
      twitchClip: undefined,
      type: 'stvEmoteLink',
    });

    expect({
      thumbnail,
      provider: thumbnail ? describeEmoteUrl(thumbnail).provider : null,
    }).toEqual({
      thumbnail: 'https://cdn.7tv.app/emote/01F6MZGCMR000F9PFB2X8E0V0V/4x.webp',
      provider: '7tv',
    });
  });
});
