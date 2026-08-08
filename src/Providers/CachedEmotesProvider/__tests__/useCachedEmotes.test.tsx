import { act, renderHook } from '@testing-library/react-native';

import type { SanitisedEmote } from '@app/types/emote';

import { useCachedEmotes } from '../useCachedEmotes';

const mockWarm = jest.fn<Promise<void>, [string[], { pin: boolean }]>();
const mockRelease = jest.fn();
const mockAbortInflight = jest.fn();

jest.mock('../cache-service', () => ({
  abortInflightEmoteDecodes: () => mockAbortInflight(),
  releaseChannelEmoteRefs: (...args: unknown[]) => mockRelease(...args),
  warmCachedEmoteRefs: (urls: string[], opts: { pin: boolean }) =>
    mockWarm(urls, opts),
}));

jest.mock('@app/utils/emote/resolveEmoteDisplayUrl', () => ({
  resolveEmoteDisplayUrl: (emote: { url: string }) => emote.url,
}));

const staticEmote = (index: number): SanitisedEmote =>
  ({
    id: `emote-${index}`,
    name: `emote${index}`,
    url: `https://cdn.7tv.app/emote/warm${index}/2x_static.avif`,
  }) as SanitisedEmote;

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  getCurrentEmoteData: () => ({
    sevenTvGlobalEmotes: Array.from({ length: 48 }, (_, index) =>
      staticEmote(index),
    ),
    bttvGlobalEmotes: [],
    ffzGlobalEmotes: [],
    twitchGlobalEmotes: [],
    sevenTvChannelEmotes: [],
    bttvChannelEmotes: [],
    ffzChannelEmotes: [],
    twitchChannelEmotes: [],
  }),
}));

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
