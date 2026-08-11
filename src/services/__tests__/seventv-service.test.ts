import { EmoteSetKind } from '@app/graphql/generated/gql';
import { sevenTvV4Client } from '@app/services/gql/client';
import { sevenTvService } from '@app/services/seventv-service';
import type { SevenTvSanitisedEmote } from '@app/types/emote';

import {
  customEmoteSetResponse,
  globalEmoteSetResponse,
  personalEmoteSetResponse,
} from './__fixtures__/seventv-service.fixture';

jest.mock('@app/services/gql/client', () => ({
  sevenTvV4Client: { query: jest.fn() },
}));

const client = jest.mocked(sevenTvV4Client);

describe('sevenTvService emote set sanitisation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getSanitisedEmoteSet pins the v4 mapper output and drops imageless emotes', async () => {
    client.query.mockResolvedValue({ data: customEmoteSetResponse });

    const result = await sevenTvService.getSanitisedEmoteSet('set-1');

    expect(result).toEqual<SevenTvSanitisedEmote[]>([
      {
        name: 'PagMan',
        id: 'emote-a',
        url: 'https://cdn.7tv.app/emote/emote-a/4x.webp',
        static_url: 'https://cdn.7tv.app/emote/emote-a/4x_static.avif',
        image_variants: {
          animated: {
            '1x': 'https://cdn.7tv.app/emote/emote-a/1x.webp',
            '4x': 'https://cdn.7tv.app/emote/emote-a/4x.webp',
          },
          static: {
            '4x': 'https://cdn.7tv.app/emote/emote-a/4x_static.avif',
          },
        },
        flags: 0,
        original_name: 'PagManOriginal',
        creator: 'CreatorA',
        emote_link: 'https://7tv.app/emotes/emote-a',
        provider: '7tv',
        site: '7TV Channel',
        frame_count: 10,
        format: 'webp',
        aspect_ratio: 128 / 96,
        zero_width: false,
        width: 128,
        height: 96,
        set_metadata: {
          setId: 'set-1',
          setName: 'Channel Set',
          capacity: 600,
          ownerId: 'owner-1',
          kind: EmoteSetKind.Normal,
          updatedAt: '2026-01-01T00:00:00.000Z',
          totalCount: 3,
        },
      },
      {
        name: 'SoSnowy',
        id: 'emote-b',
        url: 'https://cdn.7tv.app/emote/emote-b/4x.avif',
        static_url: 'https://cdn.7tv.app/emote/emote-b/4x.avif',
        image_variants: {
          static: {
            '1x': 'https://cdn.7tv.app/emote/emote-b/1x.avif',
            '4x': 'https://cdn.7tv.app/emote/emote-b/4x.avif',
          },
        },
        flags: 256,
        original_name: 'SoSnowy',
        creator: null,
        emote_link: 'https://7tv.app/emotes/emote-b',
        provider: '7tv',
        site: '7TV Channel',
        frame_count: 1,
        format: 'avif',
        aspect_ratio: 1,
        zero_width: true,
        width: 128,
        height: 128,
        set_metadata: {
          setId: 'set-1',
          setName: 'Channel Set',
          capacity: 600,
          ownerId: 'owner-1',
          kind: EmoteSetKind.Normal,
          updatedAt: '2026-01-01T00:00:00.000Z',
          totalCount: 3,
        },
      },
    ]);
  });

  test('getSanitisedEmoteSet maps the global set with the 7TV Global site', async () => {
    client.query.mockResolvedValue({ data: globalEmoteSetResponse });

    const result = await sevenTvService.getSanitisedEmoteSet('global');

    expect(result.map(emote => ({ id: emote.id, site: emote.site }))).toEqual([
      { id: 'emote-b', site: '7TV Global' },
    ]);
    expect(result[0]?.set_metadata).toEqual<
      SevenTvSanitisedEmote['set_metadata']
    >({
      setId: 'set-global',
      setName: 'Global Set',
      capacity: null,
      ownerId: null,
      kind: EmoteSetKind.Global,
      updatedAt: '2026-01-02T00:00:00.000Z',
      totalCount: 1,
    });
  });

  test('getPersonalEmoteSet pins the personal mapper output', async () => {
    client.query.mockResolvedValue({ data: personalEmoteSetResponse });

    const result = await sevenTvService.getPersonalEmoteSet('123');

    expect(result).toEqual<SevenTvSanitisedEmote[]>([
      {
        name: 'peepoShy',
        id: 'emote-p',
        url: 'https://cdn.7tv.app/emote/emote-p/4x.webp',
        static_url: 'https://cdn.7tv.app/emote/emote-p/4x_static.avif',
        image_variants: {
          animated: {
            '4x': 'https://cdn.7tv.app/emote/emote-p/4x.webp',
          },
          static: {
            '4x': 'https://cdn.7tv.app/emote/emote-p/4x_static.avif',
          },
        },
        flags: 1,
        original_name: 'peepoShy',
        creator: 'CreatorP',
        emote_link: 'https://7tv.app/emotes/emote-p',
        provider: '7tv',
        site: '7TV Personal',
        frame_count: 20,
        format: 'webp',
        aspect_ratio: 2,
        zero_width: true,
        width: 64,
        height: 32,
        set_metadata: {
          setId: 'pset-1',
          setName: 'Personal',
          capacity: null,
          ownerId: null,
          kind: EmoteSetKind.Personal,
          updatedAt: '',
          totalCount: 1,
        },
      },
    ]);
  });
});
