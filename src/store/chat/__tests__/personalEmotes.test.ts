import { EmoteSetKind } from '@app/graphql/generated/gql';
import { sevenTvService } from '@app/services/seventv-service';
import type { SevenTvSanitisedEmote } from '@app/types/emote';

import {
  clearPersonalEmotesCache,
  fetchUserPersonalEmotes,
  refreshUserPersonalEmotes,
} from '../actions/personalEmotes';
import { chatStore$ } from '../observables/chatStore';
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

jest.mock('@app/utils/logger', () => ({
  logger: {
    stv: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

jest.mock('@app/services/seventv-service', () => ({
  sevenTvService: {
    getPersonalEmoteSet: jest.fn(),
  },
}));

const mockGetPersonalEmoteSet = jest.mocked(sevenTvService.getPersonalEmoteSet);

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
        ...structuredClone(emptyEmoteData),
        lastUpdated: 1_000,
      },
    });
  });

  test('returns fetched emotes and caches them', async () => {
    mockGetPersonalEmoteSet.mockResolvedValueOnce([personalEmote]);

    const result = await fetchUserPersonalEmotes(twitchUserId, channelId);

    expect(result).toEqual<SevenTvSanitisedEmote[]>([personalEmote]);
    expect(mockGetPersonalEmoteSet).toHaveBeenCalledTimes(1);
  });

  test('stamps a failed fetch so it is not retried on the next pass', async () => {
    mockGetPersonalEmoteSet.mockRejectedValue(new Error('no 7tv account'));

    const first = await fetchUserPersonalEmotes(twitchUserId, channelId);
    const second = await fetchUserPersonalEmotes(twitchUserId, channelId);

    expect(first).toBeNull();
    expect(second).toEqual<SevenTvSanitisedEmote[]>([]);
    expect(mockGetPersonalEmoteSet).toHaveBeenCalledTimes(1);
  });
});

describe('personalEmotesVersion', () => {
  beforeEach(() => {
    mockGetPersonalEmoteSet.mockReset();
    clearPersonalEmotesCache();
    chatStore$.persisted.channelCaches.set({
      [channelId]: {
        ...structuredClone(emptyEmoteData),
        lastUpdated: 1_000,
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
