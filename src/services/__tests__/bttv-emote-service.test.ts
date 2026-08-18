import type { BttvBadge } from '@app/types/bttv/badge';
import type { BttvEmote } from '@app/types/bttv/emote';
import type { BttvSanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { bttvCachedApi } from '../api/clients';
import { bttvEmoteService } from '../bttv-emote-service';

const apiGetSpy = jest.spyOn(bttvCachedApi, 'get');

const animatedEmote: BttvEmote = {
  id: 'emote1',
  code: 'catJAM',
  codeOriginal: 'catJAMOriginal',
  imageType: 'webp',
  animated: true,
  userId: 'user1',
  modifier: false,
  user: { name: 'creator1' },
};

const staticZeroWidthEmote: BttvEmote = {
  id: 'emote2',
  code: 'cvHazmat',
  imageType: 'png',
  animated: false,
  userId: 'user2',
  modifier: false,
};

describe('bttvEmoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getSanitisedGlobalEmotes sanitises animated emotes with static png variants', async () => {
    apiGetSpy.mockResolvedValue([animatedEmote]);

    const result = await bttvEmoteService.getSanitisedGlobalEmotes();

    expect(apiGetSpy).toHaveBeenCalledWith('/emotes/global');
    expect(result).toEqual<BttvSanitisedEmote[]>([
      {
        name: 'catJAM',
        id: 'emote1',
        url: 'https://cdn.betterttv.net/emote/emote1/3x',
        static_url: 'https://cdn.betterttv.net/emote/emote1/3x.png',
        image_variants: {
          animated: {
            '1x': 'https://cdn.betterttv.net/emote/emote1/1x',
            '2x': 'https://cdn.betterttv.net/emote/emote1/2x',
            '3x': 'https://cdn.betterttv.net/emote/emote1/3x',
          },
          static: {
            '1x': 'https://cdn.betterttv.net/emote/emote1/1x.png',
            '2x': 'https://cdn.betterttv.net/emote/emote1/2x.png',
            '3x': 'https://cdn.betterttv.net/emote/emote1/3x.png',
          },
        },
        emote_link: 'https://betterttv.com/emotes/emote1',
        original_name: 'catJAMOriginal',
        creator: null,
        site: 'Global BTTV',
        provider: 'bttv',
        flags: undefined,
      },
    ]);
  });

  test('getSanitisedGlobalEmotes reuses the default urls for static emotes and flags zero-width codes', async () => {
    apiGetSpy.mockResolvedValue([staticZeroWidthEmote]);

    const result = await bttvEmoteService.getSanitisedGlobalEmotes();

    expect(result).toEqual<BttvSanitisedEmote[]>([
      {
        name: 'cvHazmat',
        id: 'emote2',
        url: 'https://cdn.betterttv.net/emote/emote2/3x',
        static_url: 'https://cdn.betterttv.net/emote/emote2/3x',
        image_variants: {
          animated: {
            '1x': 'https://cdn.betterttv.net/emote/emote2/1x',
            '2x': 'https://cdn.betterttv.net/emote/emote2/2x',
            '3x': 'https://cdn.betterttv.net/emote/emote2/3x',
          },
          static: {
            '1x': 'https://cdn.betterttv.net/emote/emote2/1x',
            '2x': 'https://cdn.betterttv.net/emote/emote2/2x',
            '3x': 'https://cdn.betterttv.net/emote/emote2/3x',
          },
        },
        emote_link: 'https://betterttv.com/emotes/emote2',
        original_name: 'UNKNOWN',
        creator: null,
        site: 'Global BTTV',
        provider: 'bttv',
        flags: 256,
        zero_width: true,
      },
    ]);
  });

  test('getSanitisedChannelEmotes concatenates shared and channel emotes with per-emote creators', async () => {
    apiGetSpy.mockResolvedValue({
      id: 'channel1',
      bots: [],
      avatar: 'https://example.com/avatar.png',
      channelEmotes: [staticZeroWidthEmote],
      sharedEmotes: [animatedEmote],
    });

    const result = await bttvEmoteService.getSanitisedChannelEmotes('123');

    expect(apiGetSpy).toHaveBeenCalledWith('/users/twitch/123');
    expect(
      result.map(emote => ({ id: emote.id, creator: emote.creator })),
    ).toEqual([
      { id: 'emote1', creator: 'creator1' },
      { id: 'emote2', creator: null },
    ]);
    expect(result.map(emote => emote.site)).toEqual(['BTTV', 'BTTV']);
  });

  test('getSanitisedGlobalBadges maps badges and skips entries missing badge data', async () => {
    const fullBadge: BttvBadge = {
      id: 'badge1',
      name: 'developer_badge',
      displayName: 'Developer',
      providerId: 'twitch-user-1',
      badge: {
        type: 1,
        description: 'BTTV Developer',
        svg: 'https://cdn.betterttv.net/badges/developer.svg',
      },
    };
    const badgeWithoutArtwork: BttvBadge = {
      id: 'badge2',
      name: 'bare_badge',
      displayName: 'Bare',
      providerId: 'twitch-user-2',
    };
    apiGetSpy.mockResolvedValue([fullBadge, badgeWithoutArtwork]);

    const result = await bttvEmoteService.getSanitisedGlobalBadges();

    expect(apiGetSpy).toHaveBeenCalledWith('/badges');
    expect(result).toEqual<SanitisedBadgeSet[]>([
      {
        id: 'twitch-user-1',
        set: 'bttv',
        type: 'BTTV Badge',
        title: 'BTTV Developer',
        url: 'https://cdn.betterttv.net/badges/developer.svg',
        provider: 'bttv',
      },
    ]);
  });
});
