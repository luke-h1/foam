import { act, renderHook } from '@testing-library/react-native';

import { EmoteSetKind } from '@app/graphql/generated/gql';
import * as channelLoadActions from '@app/store/chat/actions/channelLoad';
import type { SevenTvSanitisedEmote } from '@app/types/emote';
import type { ResolvableDisplayEmote } from '@app/utils/emote/resolveEmoteDisplayUrl';
import * as resolveEmoteDisplayUrlModule from '@app/utils/emote/resolveEmoteDisplayUrl';

import * as cacheService from '../cache-service';
import { useCachedEmotes } from '../useCachedEmotes';

const mockWarm = jest.spyOn(cacheService, 'warmCachedEmoteRefs');
const mockRelease = jest.spyOn(cacheService, 'releaseChannelEmoteRefs');
const mockAbortInflight = jest.spyOn(cacheService, 'abortInflightEmoteDecodes');
mockRelease.mockImplementation(() => {});
mockAbortInflight.mockImplementation(() => {});

jest
  .spyOn(resolveEmoteDisplayUrlModule, 'resolveEmoteDisplayUrl')
  .mockImplementation((emote: ResolvableDisplayEmote) => emote.url ?? '');

const staticEmote = (index: number): SevenTvSanitisedEmote => ({
  id: `emote-${index}`,
  name: `emote${index}`,
  original_name: `emote${index}`,
  creator: null,
  emote_link: `https://7tv.app/emotes/emote-${index}`,
  provider: '7tv',
  site: '7TV Global',
  url: `https://cdn.7tv.app/emote/warm${index}/2x_static.avif`,
  frame_count: 1,
  format: 'AVIF',
  flags: 0,
  aspect_ratio: 1,
  zero_width: false,
  width: 32,
  height: 32,
  set_metadata: {
    capacity: null,
    kind: EmoteSetKind.Global,
    ownerId: null,
    setId: 'set-id',
    setName: 'global',
    totalCount: 1,
    updatedAt: '2026-05-19T00:00:00Z',
  },
});

jest.spyOn(channelLoadActions, 'getCurrentEmoteData').mockReturnValue({
  sevenTvGlobalEmotes: Array.from({ length: 48 }, (_, index) =>
    staticEmote(index),
  ),
  bttvGlobalEmotes: [],
  ffzGlobalEmotes: [],
  twitchGlobalEmotes: [],
  twitchSubscriberEmotes: [],
  sevenTvChannelEmotes: [],
  bttvChannelEmotes: [],
  ffzChannelEmotes: [],
  twitchChannelEmotes: [],
  twitchChannelBadges: [],
  twitchGlobalBadges: [],
  ffzChannelBadges: [],
  ffzGlobalBadges: [],
  chatterinoBadges: [],
  bttvBadges: [],
});

const flushMicrotasks = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

describe('useCachedEmotes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('warms in sequential batches while mounted', async () => {
    mockWarm.mockResolvedValue(undefined);
    renderHook(() => useCachedEmotes('111'));

    await act(flushMicrotasks);

    expect(mockWarm).toHaveBeenCalledTimes(2);
    expect(mockWarm.mock.calls[0]?.[0]).toHaveLength(24);
    expect(mockWarm.mock.calls[1]?.[0]).toHaveLength(24);
  });

  test('a channel hop cancels the running warm pass at the next batch', async () => {
    const resolvers: (() => void)[] = [];
    mockWarm.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolvers.push(resolve);
        }),
    );
    const { unmount } = renderHook(() => useCachedEmotes('111'));

    expect(mockWarm).toHaveBeenCalledTimes(1);

    unmount();
    expect(mockRelease).toHaveBeenCalledTimes(1);
    expect(mockAbortInflight).toHaveBeenCalledTimes(1);

    act(() => resolvers[0]?.());
    await act(flushMicrotasks);

    expect(mockWarm).toHaveBeenCalledTimes(1);
  });
});
