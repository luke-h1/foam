import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import {
  chatStore$,
  limitChannelCaches,
  migratePersistedChatStore,
} from '../observables/chatStore';
import type { ChannelCacheType, GlobalCacheType } from '../types/constants';
import {
  makeEmptyEmoteData,
  makeEmptyGlobalCacheData,
} from '../types/constants';

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
  ...makeEmptyEmoteData(),
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

describe('makeEmptyGlobalCacheData', () => {
  const emote = (id: string): SanitisedEmote => ({
    creator: null,
    emote_link: `https://example.com/${id}`,
    id,
    name: id,
    original_name: id,
    site: 'BTTV',
    provider: 'bttv',
    static_url: `https://example.com/${id}.png`,
    url: `https://example.com/${id}.webp`,
  });

  test('the store boots with its own instance, unshared with any other call', () => {
    const fresh = makeEmptyGlobalCacheData();
    const storeSlot = chatStore$.persisted.globalCaches.peek();

    expect(storeSlot).not.toBe(fresh);
    expect(storeSlot.twitchGlobalEmotes).not.toBe(fresh.twitchGlobalEmotes);
    expect(makeEmptyGlobalCacheData()).not.toBe(fresh);
    expect(makeEmptyGlobalCacheData().twitchGlobalEmotes).not.toBe(
      fresh.twitchGlobalEmotes,
    );
  });

  test('a hydration-style mutation of one instance does not leak into a clear', () => {
    const hydrated: GlobalCacheType = makeEmptyGlobalCacheData();
    hydrated.lastUpdated = 1_700_000_000_000;
    hydrated.twitchGlobalEmotes.push(emote('hydrated-emote'));
    hydrated.ffzGlobalBadges.push({
      id: 'hydrated-badge',
      set: 'hydrated-badge',
      title: 'hydrated-badge',
      type: 'FFZ Badge',
      provider: 'ffz',
      url: 'https://example.com/hydrated-badge.png',
    });

    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());

    expect(chatStore$.persisted.globalCaches.peek()).toEqual<GlobalCacheType>({
      lastUpdated: 0,
      twitchGlobalEmotes: [],
      sevenTvGlobalEmotes: [],
      ffzGlobalEmotes: [],
      bttvGlobalEmotes: [],
      twitchGlobalBadges: [],
      ffzGlobalBadges: [],
    });
    expect(makeEmptyGlobalCacheData()).toEqual<GlobalCacheType>({
      lastUpdated: 0,
      twitchGlobalEmotes: [],
      sevenTvGlobalEmotes: [],
      ffzGlobalEmotes: [],
      bttvGlobalEmotes: [],
      twitchGlobalBadges: [],
      ffzGlobalBadges: [],
    });
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
    provider: 'bttv',
    static_url: `https://example.com/${id}.png`,
    url: `https://example.com/${id}.webp`,
  });

  const badge = (id: string): SanitisedBadgeSet => ({
    id,
    set: id,
    title: id,
    type: 'FFZ Badge',
    provider: 'ffz',
    url: `https://example.com/${id}.png`,
  });

  type LegacyChannelCache = ChannelCacheType & {
    badges?: SanitisedBadgeSet[];
    chatterinoBadges?: SanitisedBadgeSet[];
    emotes?: SanitisedEmote[];
    sevenTvPersonalBadges?: Record<string, SanitisedBadgeSet[]>;
    sevenTvPersonalEmotes?: Record<string, SanitisedEmote[]>;
  } & Partial<Omit<GlobalCacheType, 'lastUpdated'>>;

  beforeEach(() => {
    chatStore$.persisted.channelCaches.set({});
    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());
  });

  test('strips legacy aggregate and global fields from hydrated channel caches', () => {
    const legacyCache: LegacyChannelCache = {
      ...makeEmptyEmoteData(),
      badges: [badge('legacy-badge')],
      bttvGlobalEmotes: [emote('legacy-global-emote')],
      chatterinoBadges: [badge('legacy-chatterino-badge')],
      emotes: [emote('legacy-emote')],
      ffzChannelBadges: [badge('kept-badge')],
      ffzGlobalBadges: [badge('legacy-global-badge')],
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
      ...makeEmptyEmoteData(),
      ffzChannelBadges: [badge('kept-badge')],
      lastUpdated: 5_000,
      twitchChannelEmotes: [emote('kept-emote')],
    });
  });

  test('seeds the global slot from the newest channel copy before stripping', () => {
    const olderCache: LegacyChannelCache = {
      ...makeEmptyEmoteData(),
      bttvGlobalEmotes: [emote('old-global-emote')],
      lastUpdated: 2_000,
    };
    const newerCache: LegacyChannelCache = {
      ...makeEmptyEmoteData(),
      bttvGlobalEmotes: [emote('new-global-emote')],
      ffzGlobalBadges: [badge('new-global-badge')],
      lastUpdated: 8_000,
    };
    chatStore$.persisted.channelCaches.set({
      'channel-old': olderCache,
      'channel-new': newerCache,
    });

    migratePersistedChatStore();

    expect(chatStore$.persisted.globalCaches.peek()).toEqual<GlobalCacheType>({
      ...makeEmptyGlobalCacheData(),
      bttvGlobalEmotes: [emote('new-global-emote')],
      ffzGlobalBadges: [badge('new-global-badge')],
      lastUpdated: 8_000,
    });
  });

  test('seeds from a stale-stamped donor when no fresher channel holds global copies', () => {
    const staleCache: LegacyChannelCache = {
      ...makeEmptyEmoteData(),
      bttvGlobalEmotes: [emote('stale-global-emote')],
      lastUpdated: 0,
    };
    chatStore$.persisted.channelCaches.set({ 'channel-1': staleCache });

    migratePersistedChatStore();

    expect(chatStore$.persisted.globalCaches.peek()).toEqual<GlobalCacheType>({
      ...makeEmptyGlobalCacheData(),
      bttvGlobalEmotes: [emote('stale-global-emote')],
      lastUpdated: 0,
    });
  });

  test('does not overwrite a populated global slot with channel copies', () => {
    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      bttvGlobalEmotes: [emote('current-global-emote')],
      lastUpdated: 9_000,
    });
    const legacyCache: LegacyChannelCache = {
      ...makeEmptyEmoteData(),
      bttvGlobalEmotes: [emote('legacy-global-emote')],
      lastUpdated: 8_000,
    };
    chatStore$.persisted.channelCaches.set({ 'channel-1': legacyCache });

    migratePersistedChatStore();

    expect(chatStore$.persisted.globalCaches.peek()).toEqual<GlobalCacheType>({
      ...makeEmptyGlobalCacheData(),
      bttvGlobalEmotes: [emote('current-global-emote')],
      lastUpdated: 9_000,
    });
  });

  test('leaves a current-shape cache untouched', () => {
    const currentCache: ChannelCacheType = {
      ...makeEmptyEmoteData(),
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
