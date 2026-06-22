jest.mock('expo-image', () => ({
  Image: {
    loadAsync: jest.fn(() => Promise.resolve({})),
    clearMemoryCache: jest.fn(),
  },
}));

import { Image, type ImageRef } from 'expo-image';
import {
  clearCachedEmoteRefs,
  ensureCachedEmoteRef,
  getCachedEmoteByteEstimate,
  getCachedEmoteRef,
  getCachedEmoteStats,
  releaseChannelEmoteRefs,
  subscribeCachedEmoteRef,
  touchCachedEmoteRef,
  trimCachedEmoteRefsForMemoryPressure,
  warmCachedEmoteRefs,
} from '@app/Providers/CachedEmotesProvider/cache-service';

const MAX_DECODED_BYTES_HIGH_TIER = 192 * 1024 * 1024;
// 6000x6000x4 = 144MB: one fits under the 192MiB high-tier budget, two don't.
const bigRef = (isAnimated = false) =>
  ({ width: 6000, height: 6000, scale: 1, isAnimated }) as unknown as ImageRef;

const loadAsync = jest.mocked(Image.loadAsync);

const flushMicrotasks = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

describe('cache-service', () => {
  beforeEach(() => {
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

  test('memory-pressure trim drops unpinned refs, keeps pinned, clears memory cache', async () => {
    const pinnedUrl = 'https://cdn.7tv.app/emote/mpPinned/2x.avif';
    const unpinnedUrl = 'https://cdn.7tv.app/emote/mpUnpinned/2x.avif';
    await warmCachedEmoteRefs([pinnedUrl], { pin: true });
    await warmCachedEmoteRefs([unpinnedUrl]);

    trimCachedEmoteRefsForMemoryPressure();

    expect(getCachedEmoteRef(pinnedUrl)).toEqual({});
    expect(getCachedEmoteRef(unpinnedUrl)).toBeNull();
    expect(Image.clearMemoryCache).toHaveBeenCalledTimes(1);
  });

  test('eviction drops the least-recently-touched unpinned ref', async () => {
    const urls = Array.from(
      { length: 1200 },
      (_, i) => `https://cdn.7tv.app/emote/lru${i}/2x.avif`,
    );
    await warmCachedEmoteRefs(urls);
    expect(getCachedEmoteStats().decoded).toBe(1200);

    // Mark the oldest-decoded entry as most-recently-used.
    touchCachedEmoteRef(urls[0]!);
    // One more decode trips the cap and evicts the now-oldest unpinned entry.
    await warmCachedEmoteRefs(['https://cdn.7tv.app/emote/lruExtra/2x.avif']);

    expect(getCachedEmoteStats().decoded).toBe(1200);
    expect(getCachedEmoteRef(urls[0]!)).toEqual({});
    expect(getCachedEmoteRef(urls[1]!)).toBeNull();
  });

  test('evicts to stay under the decoded-byte budget before the entry-count cap', async () => {
    loadAsync.mockResolvedValue(bigRef());

    await warmCachedEmoteRefs(['https://cdn.7tv.app/emote/big0/2x.avif']);
    await warmCachedEmoteRefs(['https://cdn.7tv.app/emote/big1/2x.avif']);
    await warmCachedEmoteRefs(['https://cdn.7tv.app/emote/big2/2x.avif']);

    // Two 144MB refs would exceed the 192MiB budget, so each new decode evicts
    // the previous unpinned one long before the 1200-entry count cap.
    expect(getCachedEmoteStats().decoded).toBe(1);
    expect(getCachedEmoteByteEstimate()).toBeLessThanOrEqual(
      MAX_DECODED_BYTES_HIGH_TIER,
    );
    expect(getCachedEmoteRef('https://cdn.7tv.app/emote/big2/2x.avif')).toEqual(
      bigRef(),
    );
  });

  test('the byte budget never evicts pinned refs', async () => {
    loadAsync.mockResolvedValue(bigRef());

    await warmCachedEmoteRefs(['https://cdn.7tv.app/emote/bigPinned/2x.avif'], {
      pin: true,
    });
    await warmCachedEmoteRefs([
      'https://cdn.7tv.app/emote/bigUnpinned/2x.avif',
    ]);

    // The pinned ref keeps the cache over budget rather than being evicted.
    expect(
      getCachedEmoteRef('https://cdn.7tv.app/emote/bigPinned/2x.avif'),
    ).toEqual(bigRef());
    expect(getCachedEmoteStats().pinned).toBe(1);
  });

  test('clearing the cache resets the byte estimate', async () => {
    loadAsync.mockResolvedValue(bigRef());
    await warmCachedEmoteRefs(['https://cdn.7tv.app/emote/bigClear/2x.avif']);
    expect(getCachedEmoteByteEstimate()).toBeGreaterThan(0);

    clearCachedEmoteRefs();

    expect(getCachedEmoteByteEstimate()).toBe(0);
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

    expect(loadAsync).toHaveBeenCalledTimes(8);

    releases.splice(0, 4).forEach(release => release());
    await flushMicrotasks();

    expect(loadAsync).toHaveBeenCalledTimes(12);
  });
});
