jest.mock('expo-image', () => ({
  Image: { loadAsync: jest.fn(() => Promise.resolve({})) },
}));

import { Image, type ImageRef } from 'expo-image';
import {
  clearCachedEmoteRefs,
  ensureCachedEmoteRef,
  getCachedEmoteRef,
  getCachedEmoteStats,
  releaseChannelEmoteRefs,
  subscribeCachedEmoteRef,
  warmCachedEmoteRefs,
} from '@app/Providers/CachedEmotesProvider/cache-service';

const loadAsync = jest.mocked(Image.loadAsync);

const flushMicrotasks = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

describe('cache-service', () => {
  beforeEach(() => {
    /**
     * Restore the default decode impl after any test that overrides it
     * (clearAllMocks resets calls, not implementations).
     */
    loadAsync.mockImplementation(() => Promise.resolve({} as ImageRef));
  });
  afterEach(() => {
    clearCachedEmoteRefs();
    jest.clearAllMocks();
  });

  test('clearing the cache notifies subscribers so mounted rows drop the dangling ref', () => {
    const url = 'https://cdn.7tv.app/emote/abc/2x.avif';
    const onChange = jest.fn();
    subscribeCachedEmoteRef(url, onChange);

    clearCachedEmoteRefs();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(getCachedEmoteRef(url)).toBeNull();
  });

  test('subscribers that have unsubscribed are not notified on clear', () => {
    const url = 'https://cdn.7tv.app/emote/def/2x.avif';
    const onChange = jest.fn();
    const unsubscribe = subscribeCachedEmoteRef(url, onChange);

    unsubscribe();
    clearCachedEmoteRefs();

    expect(onChange).not.toHaveBeenCalled();
  });

  test('a decode in flight when the cache is cleared cannot repopulate it afterwards', async () => {
    const url = 'https://cdn.7tv.app/emote/ghi/2x.avif';
    let resolveDecode: (ref: ImageRef) => void = () => {};
    loadAsync.mockReturnValueOnce(
      new Promise<ImageRef>(resolve => {
        resolveDecode = resolve;
      }),
    );
    const onChange = jest.fn();
    subscribeCachedEmoteRef(url, onChange);

    ensureCachedEmoteRef(url);
    clearCachedEmoteRefs();
    onChange.mockClear();

    resolveDecode({} as ImageRef);
    await flushMicrotasks();

    expect(getCachedEmoteRef(url)).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('a channel hop keeps the pinned global set decoded but drops channel refs', async () => {
    const globalUrl = 'https://cdn.7tv.app/emote/global/2x.avif';
    const channelUrl = 'https://cdn.7tv.app/emote/channel/2x.avif';
    await warmCachedEmoteRefs([globalUrl], { pin: true });
    await warmCachedEmoteRefs([channelUrl]);
    const onChannelDrop = jest.fn();
    subscribeCachedEmoteRef(channelUrl, onChannelDrop);

    releaseChannelEmoteRefs();

    expect(getCachedEmoteRef(globalUrl)).toEqual({});
    expect(getCachedEmoteRef(channelUrl)).toBeNull();
    expect(onChannelDrop).toHaveBeenCalledTimes(1);
    expect(getCachedEmoteStats()).toEqual({
      decoded: 1,
      inflight: 0,
      pinned: 1,
    });
  });

  test('a full clear drops the pinned global set too', async () => {
    const globalUrl = 'https://cdn.7tv.app/emote/global2/2x.avif';
    await warmCachedEmoteRefs([globalUrl], { pin: true });

    clearCachedEmoteRefs();

    expect(getCachedEmoteRef(globalUrl)).toBeNull();
    expect(getCachedEmoteStats()).toEqual({
      decoded: 0,
      inflight: 0,
      pinned: 0,
    });
  });

  test('re-warming an already-decoded url pins it without a second decode', async () => {
    const url = 'https://cdn.7tv.app/emote/promote/2x.avif';
    await warmCachedEmoteRefs([url]);
    expect(getCachedEmoteStats()).toEqual({
      decoded: 1,
      inflight: 0,
      pinned: 0,
    });

    await warmCachedEmoteRefs([url], { pin: true });

    expect(loadAsync).toHaveBeenCalledTimes(1);
    expect(getCachedEmoteStats()).toEqual({
      decoded: 1,
      inflight: 0,
      pinned: 1,
    });
  });

  test('caps concurrent decodes and drains the queue as slots free', async () => {
    const releases: (() => void)[] = [];
    loadAsync.mockImplementation(
      () =>
        new Promise<ImageRef>(resolve => {
          releases.push(() => resolve({} as ImageRef));
        }),
    );

    Array.from(
      { length: 12 },
      (_, i) => `https://cdn.7tv.app/emote/conc${i}/2x.avif`,
    ).forEach(url => ensureCachedEmoteRef(url));
    await flushMicrotasks();

    // MAX_CONCURRENT_DECODES = 8: eight decode, four wait in the queue.
    expect(loadAsync).toHaveBeenCalledTimes(8);

    releases.splice(0, 4).forEach(release => release());
    await flushMicrotasks();

    // Freed slots pull the queued decodes through.
    expect(loadAsync).toHaveBeenCalledTimes(12);
  });
});
