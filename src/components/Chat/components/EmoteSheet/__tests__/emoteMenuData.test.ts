import { EmoteSetKind } from '@app/graphql/generated/gql';

import {
  buildEmoteMenuProviders,
  filterProviderSets,
  flattenProviderSets,
} from '../emoteMenuData';
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

  test('groups subscriber emotes by channel with profile name and avatar icon', () => {
    const providers = buildEmoteMenuProviders({
      twitchSubscriberEmotes: [
        createMenuEmote('1', 'SubA', 'Twitch Subscriber', {
          owner_id: 'owner-a',
        }),
        createMenuEmote('2', 'SubB', 'Twitch Subscriber', {
          owner_id: 'owner-b',
        }),
        createMenuEmote('3', 'SubA2', 'Twitch Subscriber', {
          owner_id: 'owner-a',
        }),
      ],
      twitchSubscriberChannelProfiles: {
        'owner-a': {
          name: 'Streamer A',
          profileImageUrl: 'https://example.com/a.png',
        },
        'owner-b': {
          name: 'Streamer B',
          profileImageUrl: 'https://example.com/b.png',
        },
      },
    });

    const twitchProvider = providers.find(provider => provider.id === 'Twitch');
    expect(twitchProvider?.sets).toEqual([
      {
        emotes: [
          createMenuEmote('1', 'SubA', 'Twitch Subscriber', {
            owner_id: 'owner-a',
          }),
          createMenuEmote('3', 'SubA2', 'Twitch Subscriber', {
            owner_id: 'owner-a',
          }),
        ],
        icon: 'avatar:https://example.com/a.png',
        id: 'twitch-sub-owner-a',
        provider: 'Twitch',
        shortLabel: 'SA',
        title: 'Streamer A',
      },
      {
        emotes: [
          createMenuEmote('2', 'SubB', 'Twitch Subscriber', {
            owner_id: 'owner-b',
          }),
        ],
        icon: 'avatar:https://example.com/b.png',
        id: 'twitch-sub-owner-b',
        provider: 'Twitch',
        shortLabel: 'SB',
        title: 'Streamer B',
      },
    ]);
  });

  test('falls back to subscribed emotes set when subscriber emotes lack owner_id', () => {
    const providers = buildEmoteMenuProviders({
      twitchSubscriberEmotes: [
        createMenuEmote('1', 'LegacySub', 'Twitch Subscriber'),
      ],
    });

    const twitchProvider = providers.find(provider => provider.id === 'Twitch');
    expect(twitchProvider?.sets).toEqual([
      {
        emotes: [createMenuEmote('1', 'LegacySub', 'Twitch Subscriber')],
        icon: 'twitch',
        id: 'twitch-user',
        provider: 'Twitch',
        shortLabel: 'SE',
        title: 'Subscribed Emotes',
      },
    ]);
  });

  test('uses fallback channel title and twitch icon when profile is missing', () => {
    const providers = buildEmoteMenuProviders({
      twitchSubscriberEmotes: [
        createMenuEmote('1', 'SubA', 'Twitch Subscriber', {
          owner_id: 'owner-unknown',
        }),
      ],
      twitchSubscriberChannelProfiles: {},
    });

    const twitchProvider = providers.find(provider => provider.id === 'Twitch');
    expect(twitchProvider?.sets).toEqual([
      {
        emotes: [
          createMenuEmote('1', 'SubA', 'Twitch Subscriber', {
            owner_id: 'owner-unknown',
          }),
        ],
        icon: 'twitch',
        id: 'twitch-sub-owner-unknown',
        provider: 'Twitch',
        shortLabel: 'SC',
        title: 'Subscribed Channel',
      },
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
