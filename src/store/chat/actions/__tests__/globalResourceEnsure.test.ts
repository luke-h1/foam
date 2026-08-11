import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { makeEmptyGlobalCacheData } from '@app/store/chat/types/constants';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { clearGlobalResourceCache } from '../channelResources';
import { ensureGlobalChatResources } from '../globalResourceEnsure';

const mockEmoteSpecs = jest.fn();
const mockBadgeSpecs = jest.fn();

jest.mock('../channelResources', () => {
  const actual = jest.requireActual<typeof import('../channelResources')>(
    '../channelResources',
  );
  return {
    ...actual,
    buildGlobalEmoteResourceSpecs: () => mockEmoteSpecs(),
    buildGlobalBadgeResourceSpecs: () => mockBadgeSpecs(),
  };
});

const twitchEmote = {
  id: 'global-emote',
  name: 'GlobalEmote',
} as unknown as SanitisedEmote;

describe('ensureGlobalChatResources', () => {
  beforeEach(() => {
    clearGlobalResourceCache();
    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());
    mockBadgeSpecs.mockReturnValue([]);
  });

  test('writes fetched global emotes into the store', async () => {
    mockEmoteSpecs.mockReturnValue([
      {
        key: 'twitchGlobalEmotes',
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
    const badge = { id: 'global-badge' } as unknown as SanitisedBadgeSet;
    mockEmoteSpecs.mockReturnValue([]);
    mockBadgeSpecs.mockReturnValue([
      { key: 'twitchGlobalBadges', fetch: () => Promise.resolve([badge]) },
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
    mockEmoteSpecs.mockReturnValue([
      { key: 'twitchGlobalEmotes', fetch: () => pending },
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
