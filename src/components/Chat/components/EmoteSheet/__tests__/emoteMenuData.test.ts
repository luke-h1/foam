import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SanitisedEmote } from '@app/types/emote';

import {
  buildEmoteMenuProviders,
  filterProviderSets,
  flattenProviderSets,
} from '../emoteMenuData';

function createEmote(
  id: string,
  name: string,
  site: SanitisedEmote['site'],
  overrides: Partial<SanitisedEmote> = {},
): SanitisedEmote {
  return {
    id,
    name,
    original_name: name,
    url: `https://cdn.example.com/${id}.webp`,
    creator: null,
    emote_link: '',
    site,
    ...((site === '7TV Channel' || site === '7TV Global'
      ? {
          frame_count: 1,
          format: 'webp',
          flags: 0,
          aspect_ratio: 1,
          zero_width: false,
          width: 32,
          height: 32,
          set_metadata: {
            setId: 'set-default',
            setName: 'Default Set',
            capacity: null,
            ownerId: null,
            kind: EmoteSetKind.Normal,
            updatedAt: '',
            totalCount: 2,
          },
        }
      : {}) as Partial<SanitisedEmote>),
    ...overrides,
  } as SanitisedEmote;
}

describe('emoteMenuData', () => {
  test('builds providers and groups 7TV emotes by set metadata', () => {
    const providers = buildEmoteMenuProviders({
      sevenTvChannelEmotes: [
        createEmote('1', 'Smile', '7TV Channel', {
          set_metadata: {
            setId: 'set-a',
            setName: 'Channel Prime',
            capacity: null,
            ownerId: null,
            kind: EmoteSetKind.Normal,
            updatedAt: '',
            totalCount: 1,
          },
        }),
        createEmote('2', 'Wave', '7TV Channel', {
          set_metadata: {
            setId: 'set-b',
            setName: 'Mods',
            capacity: null,
            ownerId: null,
            kind: EmoteSetKind.Normal,
            updatedAt: '',
            totalCount: 1,
          },
        }),
      ],
      twitchGlobalEmotes: [createEmote('3', 'Kappa', 'Twitch Global')],
      emojis: ['😀', '😂', '😍'],
    });

    expect(providers.map(provider => provider.id)).toEqual([
      '7TV',
      'Twitch',
      'Emoji',
    ]);
    expect(providers[0]?.sets.map(set => set.title)).toEqual([
      'Channel Prime',
      'Mods',
    ]);
  });

  test('filters sets by emote name within a provider', () => {
    const provider = buildEmoteMenuProviders({
      sevenTvChannelEmotes: [
        createEmote('1', 'Smile', '7TV Channel', {
          set_metadata: {
            setId: 'set-a',
            setName: 'Channel',
            capacity: null,
            ownerId: null,
            kind: EmoteSetKind.Normal,
            updatedAt: '',
            totalCount: 2,
          },
        }),
        createEmote('2', 'Wave', '7TV Channel', {
          set_metadata: {
            setId: 'set-a',
            setName: 'Channel',
            capacity: null,
            ownerId: null,
            kind: EmoteSetKind.Normal,
            updatedAt: '',
            totalCount: 2,
          },
        }),
      ],
    })[0];

    const filteredSets = filterProviderSets(provider, 'smi');

    expect(filteredSets).toHaveLength(1);
    expect(filteredSets[0]?.emotes).toHaveLength(1);
    expect(
      typeof filteredSets[0]?.emotes[0] === 'object'
        ? filteredSets[0]?.emotes[0].name
        : null,
    ).toBe('Smile');
  });

  test('flattens sets into header and row items for virtualization', () => {
    const provider = buildEmoteMenuProviders({
      twitchChannelEmotes: [
        createEmote('1', 'A', 'Twitch Channel'),
        createEmote('2', 'B', 'Twitch Channel'),
        createEmote('3', 'C', 'Twitch Channel'),
      ],
    })[0];

    const flattened = flattenProviderSets(provider?.sets ?? [], 2);

    expect(flattened.items.map(item => item.type)).toEqual([
      'header',
      'row',
      'row',
    ]);
    expect(flattened.setStartIndices).toEqual([0]);
    expect(flattened.items[1]?.items).toHaveLength(2);
    expect(flattened.items[2]?.items).toHaveLength(1);
  });
});
