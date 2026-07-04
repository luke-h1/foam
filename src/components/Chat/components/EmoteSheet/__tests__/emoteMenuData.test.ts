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

  test('splits subscriber emotes into per-channel sets with streamer avatars', () => {
    const providers = buildEmoteMenuProviders({
      twitchSubscriberEmotes: [
        createMenuEmote('1', 'zoilAws', 'Twitch Subscriber', {
          owner_id: '100',
        }),
        createMenuEmote('2', 'zoilPog', 'Twitch Subscriber', {
          owner_id: '100',
        }),
        createMenuEmote('3', 'forsenE', 'Twitch Subscriber', {
          owner_id: '200',
        }),
        createMenuEmote('4', 'legacyHi', 'Twitch Subscriber'),
      ],
      twitchSubscriberChannelProfiles: {
        '100': {
          name: 'Zoil',
          profileImageUrl: 'https://cdn.example.com/zoil.png',
        },
      },
    });

    const twitchProvider = providers.find(provider => provider.id === 'Twitch');

    expect(
      twitchProvider?.sets.map(set => ({
        id: set.id,
        title: set.title,
        icon: set.icon,
        emoteCount: set.emotes.length,
      })),
    ).toEqual([
      {
        id: 'twitch-sub-100',
        title: 'Zoil',
        icon: 'avatar:https://cdn.example.com/zoil.png',
        emoteCount: 2,
      },
      {
        id: 'twitch-user',
        title: 'Subscribed Emotes',
        icon: 'twitch',
        emoteCount: 2,
      },
    ]);
  });

  test('orders subscriber channel sets alphabetically before channel and global sets', () => {
    const providers = buildEmoteMenuProviders({
      twitchSubscriberEmotes: [
        createMenuEmote('1', 'zoilAws', 'Twitch Subscriber', {
          owner_id: '100',
        }),
        createMenuEmote('2', 'aletHi', 'Twitch Subscriber', {
          owner_id: '200',
        }),
      ],
      twitchSubscriberChannelProfiles: {
        '100': {
          name: 'Zoil',
          profileImageUrl: 'https://cdn.example.com/zoil.png',
        },
        '200': {
          name: 'Alet',
          profileImageUrl: 'https://cdn.example.com/alet.png',
        },
      },
      twitchChannelEmotes: [createMenuEmote('3', 'chanHi', 'Twitch Channel')],
      twitchGlobalEmotes: [createMenuEmote('4', 'Kappa', 'Twitch Global')],
    });

    const twitchProvider = providers.find(provider => provider.id === 'Twitch');

    expect(twitchProvider?.sets.map(set => set.title)).toEqual([
      'Alet',
      'Zoil',
      'Channel Emotes',
      'Global Emotes',
    ]);
  });

  test('falls back to a twitch icon for subscriber channels without a profile image', () => {
    const providers = buildEmoteMenuProviders({
      twitchSubscriberEmotes: [
        createMenuEmote('1', 'zoilAws', 'Twitch Subscriber', {
          owner_id: '100',
        }),
      ],
      twitchSubscriberChannelProfiles: {
        '100': { name: 'Zoil', profileImageUrl: '' },
      },
    });

    const twitchProvider = providers.find(provider => provider.id === 'Twitch');

    expect(
      twitchProvider?.sets.map(set => ({ title: set.title, icon: set.icon })),
    ).toEqual([{ title: 'Zoil', icon: 'twitch' }]);
  });

  test('lists personal emotes as the first 7TV set', () => {
    const providers = buildEmoteMenuProviders({
      sevenTvPersonalEmotes: [createMenuEmote('1', 'MyEmote', '7TV Personal')],
      sevenTvGlobalEmotes: [createMenuEmote('2', 'GlobalWave', '7TV Global')],
    });

    const sevenTvProvider = providers.find(provider => provider.id === '7TV');

    expect(
      sevenTvProvider?.sets.map(set => ({ id: set.id, title: set.title })),
    ).toEqual([
      { id: '7tv-personal', title: 'Personal Emotes' },
      { id: '7tv-global-set-default', title: 'Default Set' },
    ]);
  });

  test('omits the personal emotes set when the user has none', () => {
    const providers = buildEmoteMenuProviders({
      sevenTvPersonalEmotes: [],
      sevenTvGlobalEmotes: [createMenuEmote('1', 'GlobalWave', '7TV Global')],
    });

    const sevenTvProvider = providers.find(provider => provider.id === '7TV');

    expect(sevenTvProvider?.sets.map(set => set.id)).toEqual([
      '7tv-global-set-default',
    ]);
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
