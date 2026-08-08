import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import {
  chatStore$,
  limitChannelCaches,
  migratePersistedChatStore,
} from '../observables/chatStore';
import type { ChannelCacheType } from '../types/constants';
import { emptyEmoteData } from '../types/constants';

jest.mock('@legendapp/state/persist', () => ({
  configureObservablePersistence: jest.fn(),
  persistObservable: jest.fn(),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: class MockMMKV {
    set = jest.fn();
    getString = jest.fn();
    getAllKeys = jest.fn(() => []);
    delete = jest.fn();
  },
  createMMKV: () => ({
    set: jest.fn(),
    getString: jest.fn(),
    getAllKeys: jest.fn(() => []),
    remove: jest.fn(),
  }),
}));

const makeCache = (lastUpdated: number) => ({
  ...emptyEmoteData,
  lastUpdated,
});

describe('limitChannelCaches', () => {
  test('prunes stale channels without requiring Array.prototype.toSorted', () => {
    const arrayPrototype = Array.prototype as { toSorted?: unknown };
    const nativeToSorted = arrayPrototype.toSorted;
    delete arrayPrototype.toSorted;

    try {
      const result = limitChannelCaches(
        {
          'channel-0': makeCache(0),
          'channel-1': makeCache(1),
          'channel-2': makeCache(2),
          'channel-3': makeCache(3),
          'channel-4': makeCache(4),
          'channel-5': makeCache(5),
          'channel-6': makeCache(6),
          'channel-7': makeCache(7),
          'channel-8': makeCache(8),
          'channel-9': makeCache(9),
          'channel-10': makeCache(10),
          'channel-11': makeCache(11),
          'channel-12': makeCache(12),
          'channel-13': makeCache(13),
          'channel-14': makeCache(14),
          'channel-15': makeCache(15),
          'channel-16': makeCache(16),
          'channel-17': makeCache(17),
          'channel-18': makeCache(18),
          'channel-19': makeCache(19),
          'channel-20': makeCache(20),
          current: makeCache(-1),
        },
        'current',
      );

      expect(Object.keys(result)).toHaveLength(20);
      expect(result.current).toBeDefined();
      expect(result['channel-0']).toBeUndefined();
      expect(result['channel-20']).toBeDefined();
    } finally {
      if (nativeToSorted) {
        arrayPrototype.toSorted = nativeToSorted;
      }
    }
  });
});

describe('migratePersistedChatStore', () => {
  const emote = (id: string): SanitisedEmote => ({
    creator: null,
    emote_link: `https://example.com/${id}`,
    id,
    name: id,
    original_name: id,
    site: 'BTTV',
    static_url: `https://example.com/${id}.png`,
    url: `https://example.com/${id}.webp`,
  });

  const badge = (id: string): SanitisedBadgeSet => ({
    id,
    set: id,
    title: id,
    type: 'FFZ Badge',
    url: `https://example.com/${id}.png`,
  });

  beforeEach(() => {
    chatStore$.persisted.channelCaches.set({});
  });

  test('strips legacy aggregate fields from hydrated channel caches', () => {
    const legacyCache: ChannelCacheType & {
      badges: SanitisedBadgeSet[];
      chatterinoBadges: SanitisedBadgeSet[];
      emotes: SanitisedEmote[];
      sevenTvPersonalBadges: Record<string, SanitisedBadgeSet[]>;
      sevenTvPersonalEmotes: Record<string, SanitisedEmote[]>;
    } = {
      ...emptyEmoteData,
      badges: [badge('legacy-badge')],
      chatterinoBadges: [badge('legacy-chatterino-badge')],
      emotes: [emote('legacy-emote')],
      ffzGlobalBadges: [badge('kept-badge')],
      lastUpdated: 5_000,
      sevenTvPersonalBadges: {},
      sevenTvPersonalEmotes: { 'user-1': [emote('legacy-personal-emote')] },
      twitchChannelEmotes: [emote('kept-emote')],
    };
    chatStore$.persisted.channelCaches.set({ 'channel-1': legacyCache });

    migratePersistedChatStore();

    expect(
      chatStore$.persisted.channelCaches.peek()['channel-1'],
    ).toEqual<ChannelCacheType>({
      ...emptyEmoteData,
      ffzGlobalBadges: [badge('kept-badge')],
      lastUpdated: 5_000,
      twitchChannelEmotes: [emote('kept-emote')],
    });
  });

  test('leaves a current-shape cache untouched', () => {
    const currentCache: ChannelCacheType = {
      ...emptyEmoteData,
      lastUpdated: 5_000,
      twitchChannelEmotes: [emote('kept-emote')],
    };
    chatStore$.persisted.channelCaches.set({ 'channel-1': currentCache });

    migratePersistedChatStore();

    expect(
      chatStore$.persisted.channelCaches.peek()['channel-1'],
    ).toEqual<ChannelCacheType>(currentCache);
  });
});
