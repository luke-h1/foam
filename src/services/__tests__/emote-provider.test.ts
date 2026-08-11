import { EmoteSetKind } from '@app/graphql/generated/gql';
import type {
  BttvSanitisedEmote,
  FfzSanitisedEmote,
  SevenTvSanitisedEmote,
  TwitchSanitisedEmote,
} from '@app/types/emote';

import { buildSanitisedEmote } from '../emote-provider';

describe('buildSanitisedEmote', () => {
  test('assembles a BTTV emote, stamping provider, zero-width flags, and the highest available scale', () => {
    const result = buildSanitisedEmote({
      id: 'emote1',
      name: 'cvHazmat',
      site: 'BTTV',
      creator: 'someUser',
      emoteLink: 'https://provider.example/emotes/emote1',
      originalName: 'cvHazmatOriginal',
      animated: {
        '2x': 'https://cdn.example/emote1/animated/2x',
        '3x': 'https://cdn.example/emote1/animated/3x',
      },
      static: {
        '2x': 'https://cdn.example/emote1/static/2x',
        '3x': 'https://cdn.example/emote1/static/3x',
      },
      zeroWidth: true,
    });

    expect(result).toEqual<BttvSanitisedEmote>({
      id: 'emote1',
      name: 'cvHazmat',
      url: 'https://cdn.example/emote1/animated/3x',
      static_url: 'https://cdn.example/emote1/static/3x',
      image_variants: {
        animated: {
          '2x': 'https://cdn.example/emote1/animated/2x',
          '3x': 'https://cdn.example/emote1/animated/3x',
        },
        static: {
          '2x': 'https://cdn.example/emote1/static/2x',
          '3x': 'https://cdn.example/emote1/static/3x',
        },
      },
      emote_link: 'https://provider.example/emotes/emote1',
      original_name: 'cvHazmatOriginal',
      creator: 'someUser',
      site: 'BTTV',
      provider: 'bttv',
      flags: 256,
      zero_width: true,
    });
  });

  test('assembles an FFZ emote, deriving the aspect ratio and defaulting original_name to UNKNOWN', () => {
    const result = buildSanitisedEmote({
      id: '128054',
      name: 'OMEGALUL',
      site: 'Global FFZ',
      creator: null,
      emoteLink: 'https://www.frankerfacez.com/emoticon/128054',
      animated: {},
      static: {
        '2x': 'https://cdn.example/128054/static/2',
        '4x': 'https://cdn.example/128054/static/4',
      },
      width: 31,
      height: 32,
    });

    expect(result).toEqual<FfzSanitisedEmote>({
      id: '128054',
      name: 'OMEGALUL',
      url: 'https://cdn.example/128054/static/4',
      static_url: 'https://cdn.example/128054/static/4',
      image_variants: {
        static: {
          '2x': 'https://cdn.example/128054/static/2',
          '4x': 'https://cdn.example/128054/static/4',
        },
      },
      emote_link: 'https://www.frankerfacez.com/emoticon/128054',
      original_name: 'UNKNOWN',
      creator: null,
      site: 'Global FFZ',
      provider: 'ffz',
      width: 31,
      height: 32,
      aspect_ratio: 31 / 32,
    });
  });

  test('assembles a Twitch emote, dropping empty variant urls and carrying the owner id', () => {
    const result = buildSanitisedEmote({
      id: 'emote3',
      name: 'Sparse',
      site: 'Twitch Subscriber',
      creator: null,
      emoteLink: 'https://provider.example/emotes/emote3',
      originalName: 'Sparse',
      animated: {
        '2x': '',
        '4x': 'https://cdn.example/emote3/animated/4x',
      },
      static: {
        '2x': 'https://cdn.example/emote3/static/2x',
        '4x': '',
      },
      ownerId: 'owner-9',
    });

    expect(result).toEqual<TwitchSanitisedEmote>({
      id: 'emote3',
      name: 'Sparse',
      url: 'https://cdn.example/emote3/animated/4x',
      static_url: 'https://cdn.example/emote3/static/2x',
      image_variants: {
        animated: {
          '4x': 'https://cdn.example/emote3/animated/4x',
        },
        static: {
          '2x': 'https://cdn.example/emote3/static/2x',
        },
      },
      emote_link: 'https://provider.example/emotes/emote3',
      original_name: 'Sparse',
      creator: null,
      site: 'Twitch Subscriber',
      provider: 'twitch',
      owner_id: 'owner-9',
    });
  });

  test('assembles a 7TV emote from resolved urls and derives its emote link', () => {
    const setMetadata = {
      setId: 'set-1',
      setName: 'Channel Set',
      capacity: 600,
      ownerId: 'owner-1',
      kind: EmoteSetKind.Normal,
      updatedAt: '2026-01-01T00:00:00.000Z',
      totalCount: 1,
    };

    const result = buildSanitisedEmote({
      site: '7TV Channel',
      id: 'emote-a',
      name: 'PagMan',
      originalName: 'PagManOriginal',
      creator: 'CreatorA',
      url: 'https://cdn.7tv.app/emote/emote-a/4x.webp',
      staticUrl: 'https://cdn.7tv.app/emote/emote-a/4x_static.avif',
      imageVariants: {
        animated: { '4x': 'https://cdn.7tv.app/emote/emote-a/4x.webp' },
      },
      flags: 0,
      frameCount: 10,
      format: 'webp',
      aspectRatio: 1.5,
      zeroWidth: false,
      width: 96,
      height: 64,
      setMetadata,
    });

    expect(result).toEqual<SevenTvSanitisedEmote>({
      name: 'PagMan',
      id: 'emote-a',
      url: 'https://cdn.7tv.app/emote/emote-a/4x.webp',
      static_url: 'https://cdn.7tv.app/emote/emote-a/4x_static.avif',
      image_variants: {
        animated: { '4x': 'https://cdn.7tv.app/emote/emote-a/4x.webp' },
      },
      flags: 0,
      original_name: 'PagManOriginal',
      creator: 'CreatorA',
      emote_link: 'https://7tv.app/emotes/emote-a',
      site: '7TV Channel',
      provider: '7tv',
      frame_count: 10,
      format: 'webp',
      aspect_ratio: 1.5,
      zero_width: false,
      width: 96,
      height: 64,
      set_metadata: setMetadata,
    });
  });

  test('returns null when no renderable url resolves', () => {
    const hosted = buildSanitisedEmote({
      id: 'emote4',
      name: 'Ghost',
      site: 'BTTV',
      creator: null,
      emoteLink: 'https://provider.example/emotes/emote4',
      animated: {},
      static: {},
      zeroWidth: false,
    });
    const sevenTv = buildSanitisedEmote({
      site: '7TV Channel',
      id: 'emote-c',
      name: 'Ghost',
      originalName: 'Ghost',
      creator: null,
      url: '',
      staticUrl: undefined,
      imageVariants: undefined,
      flags: 0,
      frameCount: 1,
      format: 'avif',
      aspectRatio: 1,
      zeroWidth: false,
      width: 0,
      height: 0,
      setMetadata: {
        setId: '',
        setName: '',
        capacity: null,
        ownerId: null,
        kind: EmoteSetKind.Normal,
        updatedAt: '',
        totalCount: 0,
      },
    });

    expect([hosted, sevenTv]).toEqual([null, null]);
  });
});
