import { act, renderHook } from '@testing-library/react-native';

import {
  createEmoteData,
  createSevenTvEmote,
} from '@app/components/chat/__tests__/__fixtures__/chatFactories.fixture';
import * as cacheService from '@app/lib/emote-cache/cacheService';
import * as channelLoadActions from '@app/store/chat/actions/channel-load';

import { useCachedEmotes } from '../use-cached-emotes';

const mockWarm = jest.spyOn(cacheService, 'warmCachedEmoteRefs');
const mockRelease = jest.spyOn(cacheService, 'releaseChannelEmoteRefs');
const mockAbortInflight = jest.spyOn(cacheService, 'abortInflightEmoteDecodes');
mockRelease.mockImplementation(() => {});
mockAbortInflight.mockImplementation(() => {});

const staticEmote = (index: number) =>
  createSevenTvEmote({
    id: `emote-${index}`,
    name: `emote${index}`,
    original_name: `emote${index}`,
    url: `https://cdn.7tv.app/emote/warm${index}/2x_static.avif`,
    static_url: undefined,
    image_variants: undefined,
    frame_count: 1,
  });

jest.spyOn(channelLoadActions, 'getCurrentEmoteData').mockReturnValue(
  createEmoteData({
    sevenTvGlobalEmotes: Array.from({ length: 48 }, (_, index) =>
      staticEmote(index),
    ),
  }),
);

const flushMicrotasks = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

describe('useCachedEmotes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('warms every channel emote while mounted', async () => {
    mockWarm.mockResolvedValue(undefined);
    renderHook(() => useCachedEmotes('111'));

    await act(flushMicrotasks);

    expect(mockWarm.mock.calls.flatMap(([urls]) => urls)).toEqual(
      Array.from(
        { length: 48 },
        (_, index) => `https://cdn.7tv.app/emote/warm${index}/2x_static.avif`,
      ),
    );
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
