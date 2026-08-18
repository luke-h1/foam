import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { makeEmptyGlobalCacheData } from '@app/store/chat/types/constants';
import type { SanitisedEmote, TwitchSanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import * as channelResources from '../channelResources';
import { clearGlobalResourceCache } from '../channelResources';
import { ensureGlobalChatResources } from '../globalResourceEnsure';

const twitchEmote: TwitchSanitisedEmote = {
  id: 'global-emote',
  name: 'GlobalEmote',
  url: 'https://static-cdn.jtvnw.net/emoticons/v2/global-emote/default/dark/2.0',
  original_name: 'GlobalEmote',
  creator: null,
  emote_link: 'https://twitch.tv/emotes/global-emote',
  provider: 'twitch',
  site: 'Twitch Global',
};

describe('ensureGlobalChatResources', () => {
  let emoteSpecsSpy: jest.SpiedFunction<
    typeof channelResources.buildGlobalEmoteResourceSpecs
  >;
  let badgeSpecsSpy: jest.SpiedFunction<
    typeof channelResources.buildGlobalBadgeResourceSpecs
  >;

  beforeEach(() => {
    clearGlobalResourceCache();
    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());
    emoteSpecsSpy = jest.spyOn(
      channelResources,
      'buildGlobalEmoteResourceSpecs',
    );
    badgeSpecsSpy = jest
      .spyOn(channelResources, 'buildGlobalBadgeResourceSpecs')
      .mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('writes fetched global emotes into the store', async () => {
    emoteSpecsSpy.mockReturnValue([
      {
        key: 'twitchGlobalEmotes',
        name: 'twitch_global_emotes',
        label: 'Twitch global emotes',
        provider: 'twitch',
        resourceType: 'emotes',
        scope: 'global',
        warningName: 'twitch_emotes_warning',
        fetch: () => Promise.resolve([twitchEmote]),
      },
    ]);

    await ensureGlobalChatResources();

    expect(chatStore$.persisted.globalCaches.peek().twitchGlobalEmotes).toEqual(
      [twitchEmote],
    );
  });

  test('still fetches badges when a fresh cache holds emotes but no badges', async () => {
    chatStore$.persisted.globalCaches.set({
      ...makeEmptyGlobalCacheData(),
      twitchGlobalEmotes: [twitchEmote],
      lastUpdated: Date.now(),
    });
    const badge: SanitisedBadgeSet = {
      id: 'global-badge',
      url: 'https://static-cdn.jtvnw.net/badges/v1/global-badge/2',
      type: 'Twitch Global Badge',
      title: 'Global Badge',
      set: 'global-badge',
      provider: 'twitch',
    };
    emoteSpecsSpy.mockReturnValue([]);
    badgeSpecsSpy.mockReturnValue([
      {
        key: 'twitchGlobalBadges',
        name: 'twitch_global_badges',
        label: 'Twitch global badges',
        provider: 'twitch',
        resourceType: 'badges',
        scope: 'global',
        warningName: 'twitch_badges_warning',
        fetch: () => Promise.resolve([badge]),
      },
    ]);

    await ensureGlobalChatResources();

    expect(chatStore$.persisted.globalCaches.peek().twitchGlobalBadges).toEqual(
      [badge],
    );
  });

  test('a cache clear mid-fetch fences the write-back instead of resurrecting the purged data', async () => {
    let releaseFetch: (emotes: SanitisedEmote[]) => void = () => {};
    const pending = new Promise<SanitisedEmote[]>(resolve => {
      releaseFetch = resolve;
    });
    emoteSpecsSpy.mockReturnValue([
      {
        key: 'twitchGlobalEmotes',
        name: 'twitch_global_emotes',
        label: 'Twitch global emotes',
        provider: 'twitch',
        resourceType: 'emotes',
        scope: 'global',
        warningName: 'twitch_emotes_warning',
        fetch: () => pending,
      },
    ]);

    const ensure = ensureGlobalChatResources();

    // The user purges the cache while the fetch is still in flight.
    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());
    clearGlobalResourceCache();

    releaseFetch([twitchEmote]);
    await ensure;

    const cache = chatStore$.persisted.globalCaches.peek();
    expect(cache.twitchGlobalEmotes).toEqual([]);
    expect(cache.lastUpdated).toBe(0);
  });
});
