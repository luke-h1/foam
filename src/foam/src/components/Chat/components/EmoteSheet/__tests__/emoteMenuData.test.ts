import {
  buildEmoteMenuProviders,
  filterProviderSets,
  flattenProviderSets,
} from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';
import { EmoteSetKind } from '@app/graphql/generated/gql';

import { createMenuEmote } from './__fixtures__/emoteMenuData.fixture';

describe('emoteMenuData', () => {
  test('builds providers and groups 7TV emotes by set metadata', () => {
    const providers = buildEmoteMenuProviders({
      sevenTvChannelEmotes: [
        createMenuEmote('1', 'Smile', '7TV Channel', {
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
        createMenuEmote('2', 'Wave', '7TV Channel', {
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
      twitchGlobalEmotes: [createMenuEmote('3', 'Kappa', 'Twitch Global')],
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
        createMenuEmote('1', 'Smile', '7TV Channel', {
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
        createMenuEmote('2', 'Wave', '7TV Channel', {
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
        createMenuEmote('1', 'A', 'Twitch Channel'),
        createMenuEmote('2', 'B', 'Twitch Channel'),
        createMenuEmote('3', 'C', 'Twitch Channel'),
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
