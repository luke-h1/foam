import { EmoteSetKind } from '@app/graphql/generated/gql';
import { sevenTvService } from '@app/services/seven-tv-service';
import { flushChatStoreTimers } from '@app/test/chat-store-teardown';
import { silenceLogger } from '@app/test/silence-logger';
import type { SevenTvSanitisedEmote } from '@app/types/emote';

import {
  clearChannelPersonalEmotes,
  clearPersonalEmotesCache,
  fetchUserPersonalEmotes,
  getUserPersonalEmotes,
  refreshUserPersonalEmotes,
} from '../actions/personal-emotes';
import { chatStore$ } from '../observables/chat-store';
import type { ChannelCacheType } from '../types/constants';
import { makeEmptyEmoteData } from '../types/constants';

silenceLogger();

const mockGetPersonalEmoteSet = jest.spyOn(
  sevenTvService,
  'getPersonalEmoteSet',
);

const channelId = '123';
const twitchUserId = 'user-1';

const personalEmote: SevenTvSanitisedEmote = {
  id: 'emote-1',
  name: 'catJAM',
  url: 'https://cdn.7tv.app/emote/emote-1/2x.avif',
  original_name: 'catJAM',
  creator: null,
  emote_link: 'https://7tv.app/emotes/emote-1',
  site: '7TV Personal',
  provider: '7tv',
  frame_count: 1,
  format: 'avif',
  flags: 0,
  aspect_ratio: 1,
  zero_width: false,
  height: 32,
  width: 32,
  set_metadata: {
    setId: 'set-1',
    setName: 'Personal Emotes',
    capacity: null,
    ownerId: null,
    kind: EmoteSetKind.Personal,
    updatedAt: '',
    totalCount: 1,
  },
};

describe('fetchUserPersonalEmotes', () => {
  beforeEach(() => {
    mockGetPersonalEmoteSet.mockReset();
    clearPersonalEmotesCache();

    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        lastUpdated: 1000,
      },
    });
  });

  test('returns fetched emotes and caches them', async () => {
    mockGetPersonalEmoteSet.mockResolvedValueOnce([personalEmote]);

    const result = await fetchUserPersonalEmotes(twitchUserId, channelId);

    expect(result).toEqual<SevenTvSanitisedEmote[]>([personalEmote]);

    expect(mockGetPersonalEmoteSet).toHaveBeenCalledTimes(1);
  });

  test('does not stamp a transport error, so the next pass retries', async () => {
    mockGetPersonalEmoteSet
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValueOnce([personalEmote]);

    const first = await fetchUserPersonalEmotes(twitchUserId, channelId);
    const second = await fetchUserPersonalEmotes(twitchUserId, channelId);

    expect({ first, second }).toEqual({ first: null, second: [personalEmote] });

    expect(mockGetPersonalEmoteSet).toHaveBeenCalledTimes(2);
  });

  test('fetches a user again in a second channel', async () => {
    mockGetPersonalEmoteSet.mockResolvedValue([personalEmote]);

    await fetchUserPersonalEmotes(twitchUserId, channelId);
    const inOtherChannel = await fetchUserPersonalEmotes(twitchUserId, '456');

    expect({
      inOtherChannel,
      cached: getUserPersonalEmotes(twitchUserId, '456'),
    }).toEqual({ inOtherChannel: [personalEmote], cached: [personalEmote] });
  });

  test('caches per session without touching the persisted channel cache', async () => {
    mockGetPersonalEmoteSet.mockResolvedValueOnce([personalEmote]);

    await fetchUserPersonalEmotes(twitchUserId, channelId);

    expect(getUserPersonalEmotes(twitchUserId, channelId)).toEqual<
      SevenTvSanitisedEmote[]
    >([personalEmote]);

    expect(
      chatStore$.persisted.channelCaches.peek()[channelId],
    ).toEqual<ChannelCacheType>({
      ...makeEmptyEmoteData(),
      lastUpdated: 1000,
    });
  });

  test('clearChannelPersonalEmotes drops only that channel and lets its users refetch', async () => {
    const otherChannelId = '456';
    mockGetPersonalEmoteSet.mockResolvedValue([personalEmote]);
    await fetchUserPersonalEmotes(twitchUserId, channelId);
    await refreshUserPersonalEmotes('user-2', otherChannelId);

    clearChannelPersonalEmotes(channelId);

    expect(getUserPersonalEmotes(twitchUserId, channelId)).toEqual([]);

    expect(getUserPersonalEmotes('user-2', otherChannelId)).toEqual<
      SevenTvSanitisedEmote[]
    >([personalEmote]);

    const refetched = await fetchUserPersonalEmotes(twitchUserId, channelId);

    expect(refetched).toEqual<SevenTvSanitisedEmote[]>([personalEmote]);

    expect(mockGetPersonalEmoteSet).toHaveBeenCalledTimes(3);
  });

  test('clearPersonalEmotesCache drops cached sets and bumps the version', async () => {
    mockGetPersonalEmoteSet.mockResolvedValueOnce([personalEmote]);
    await fetchUserPersonalEmotes(twitchUserId, channelId);
    const versionBefore = chatStore$.personalEmotesVersion.peek();

    clearPersonalEmotesCache();

    expect(getUserPersonalEmotes(twitchUserId, channelId)).toEqual([]);

    expect(chatStore$.personalEmotesVersion.peek()).toBe(versionBefore + 1);
  });
});

describe('personalEmotesVersion', () => {
  beforeEach(() => {
    mockGetPersonalEmoteSet.mockReset();
    clearPersonalEmotesCache();

    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...makeEmptyEmoteData(),
        lastUpdated: 1000,
      },
    });
  });

  test('bumps when a write changes the cached emote id sequence', async () => {
    mockGetPersonalEmoteSet.mockResolvedValueOnce([personalEmote]);
    const versionBefore = chatStore$.personalEmotesVersion.peek();

    await fetchUserPersonalEmotes(twitchUserId, channelId);

    expect(chatStore$.personalEmotesVersion.peek()).toBe(versionBefore + 1);
  });

  test('does not bump when a write leaves the emote id sequence unchanged', async () => {
    mockGetPersonalEmoteSet.mockResolvedValue([personalEmote]);
    await refreshUserPersonalEmotes(twitchUserId, channelId);
    const versionBefore = chatStore$.personalEmotesVersion.peek();

    await refreshUserPersonalEmotes(twitchUserId, channelId);

    expect(chatStore$.personalEmotesVersion.peek()).toBe(versionBefore);
  });
});

afterEach(flushChatStoreTimers);
