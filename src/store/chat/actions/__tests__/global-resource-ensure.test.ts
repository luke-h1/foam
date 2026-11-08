import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { makeEmptyGlobalCacheData } from '@app/store/chat/types/constants';
import { stubEmoteProviderServices } from '@app/test/emote-provider-services';
import type { TwitchSanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { clearGlobalResourceCache } from '../channel-resources';
import { ensureGlobalChatResources } from '../global-resource-ensure';

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
  let providers: ReturnType<typeof stubEmoteProviderServices>;

  beforeEach(() => {
    clearGlobalResourceCache();
    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());

    providers = stubEmoteProviderServices();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('writes fetched global emotes into the store', async () => {
    providers.getGlobalEmotes.mockResolvedValue([twitchEmote]);

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

    providers.listTwitchGlobalBadges.mockResolvedValue([badge]);

    await ensureGlobalChatResources();

    expect(chatStore$.persisted.globalCaches.peek().twitchGlobalBadges).toEqual(
      [badge],
    );
  });

  test('a cache clear mid-fetch fences the write-back instead of resurrecting the purged data', async () => {
    let releaseFetch: (emotes: TwitchSanitisedEmote[]) => void = () => {};

    const pending = new Promise<TwitchSanitisedEmote[]>(resolve => {
      releaseFetch = resolve;
    });

    providers.getGlobalEmotes.mockReturnValue(pending);

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
