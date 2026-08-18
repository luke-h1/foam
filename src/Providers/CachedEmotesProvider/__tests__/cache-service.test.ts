import { Image, type ImageRef, type ImageSource } from 'expo-image';

import {
  abortInflightEmoteDecodes,
  clearCachedEmoteRefs,
  ensureCachedEmoteRef,
  getCachedEmoteAspectRatio,
  getCachedEmoteByteEstimate,
  getCachedEmoteRef,
  getCachedEmoteStats,
  releaseChannelEmoteRefs,
  subscribeCachedEmoteRef,
  touchCachedEmoteRef,
  trimDecodedEmotes,
  warmCachedEmoteRefs,
} from '@app/Providers/CachedEmotesProvider/cache-service';

// 5% of the mocked 8GB device (under the 600MB high-tier ceiling).
const MAX_DECODED_BYTES_HIGH_TIER = Math.floor(8 * 1024 * 1024 * 1024 * 0.05);
// ~409.6MiB / (96*96*4 bytes * 8 animated factor) ≈ 1456 refs before the count cap.
const HIGH_TIER_BYTE_BUDGET_ANIMATED_ENTRIES = 1456;

// SAFETY: ImageRef is a native SharedRef subclass with no JS constructor; the cache only reads width/height/isAnimated off it
const makeImageRef = (overrides: Partial<ImageRef> = {}): ImageRef =>
  ({ ...overrides }) as ImageRef;

const animatedRef = () => makeImageRef({ isAnimated: true });

const loadAsync = jest.mocked(Image.loadAsync);

const decodedUri = (source: ImageSource | string | number): string => {
  // SAFETY: cache-service only ever calls loadAsync with `{ uri: url }`
  const { uri } = source as ImageSource;
  return uri ?? '';
};

const flushMicrotasks = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

/**
 * requestAnimationFrame is polyfilled onto setTimeout here, so each turn drains
 * one deferred release pass. A release can be re-queued a few times, hence
 * several turns.
 */
const flushAnimationFrames = async (turns = 6) => {
  for (let turn = 0; turn < turns; turn += 1) {
    await flushMicrotasks();
  }
};

describe('cache-service', () => {
  beforeEach(() => {
    loadAsync.mockImplementation(() => Promise.resolve(makeImageRef()));
  });
  afterEach(() => {
    clearCachedEmoteRefs();
    jest.clearAllMocks();
    // clearAllMocks leaves queued mockReturnValueOnce values behind; a test
    // whose decode is fenced before loadAsync runs would leak its pending
    // promise into the next test's first decode.
    loadAsync.mockReset();
  });

  test('clearing the cache notifies subscribers so mounted rows drop the dangling ref', () => {
    const url = 'https://cdn.7tv.app/emote/abc/2x.avif';
    const onChange = jest.fn();
    subscribeCachedEmoteRef(url, onChange);

    clearCachedEmoteRefs();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(getCachedEmoteRef(url)).toBeNull();
  });

  test('records the decoded emote aspect ratio so the renderer can size a dimensionless emote', async () => {
    const url = 'https://cdn.7tv.app/emote/wide/4x.webp';
    loadAsync.mockResolvedValueOnce(makeImageRef({ width: 96, height: 32 }));

    expect(getCachedEmoteAspectRatio(url)).toBeNull();

    await warmCachedEmoteRefs([url]);

    expect(getCachedEmoteAspectRatio(url)).toBe(3);
  });

  test('does not record an aspect ratio when the decoded ref has no dimensions', async () => {
    const url = 'https://cdn.7tv.app/emote/nodims/1x.avif';
    loadAsync.mockResolvedValueOnce(makeImageRef());

    await warmCachedEmoteRefs([url]);

    expect(getCachedEmoteAspectRatio(url)).toBeNull();
  });

  test('drops the recorded aspect ratio when the emote is evicted', async () => {
    const url = 'https://cdn.7tv.app/emote/evictme/4x.webp';
    loadAsync.mockResolvedValueOnce(makeImageRef({ width: 64, height: 32 }));

    await warmCachedEmoteRefs([url]);
    expect(getCachedEmoteAspectRatio(url)).toBe(2);

    releaseChannelEmoteRefs();

    expect(getCachedEmoteAspectRatio(url)).toBeNull();
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

    resolveDecode(makeImageRef());
    await flushMicrotasks();

    expect(getCachedEmoteRef(url)).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('a channel-hop fence drops an in-flight decode and lets a re-request start fresh', async () => {
    const url = 'https://cdn.7tv.app/emote/hopstale/2x.avif';
    const release = jest.fn();
    let resolveDecode: (ref: ImageRef) => void = () => {};
    loadAsync.mockReturnValueOnce(
      new Promise<ImageRef>(resolve => {
        resolveDecode = resolve;
      }),
    );
    ensureCachedEmoteRef(url);
    // Let the decode claim a slot and start loading before the fence lands.
    await flushMicrotasks();

    abortInflightEmoteDecodes();
    resolveDecode(makeImageRef({ release }));
    await flushMicrotasks();

    expect(getCachedEmoteRef(url)).toBeNull();
    expect(release).toHaveBeenCalledTimes(1);

    ensureCachedEmoteRef(url);
    await flushMicrotasks();

    expect(loadAsync).toHaveBeenCalledTimes(2);
    expect(getCachedEmoteRef(url)).toEqual({});
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

  test('a reclaim trim drops unpinned refs, keeps pinned, clears memory cache', async () => {
    const pinnedUrl = 'https://cdn.7tv.app/emote/mpPinned/2x.avif';
    const unpinnedUrl = 'https://cdn.7tv.app/emote/mpUnpinned/2x.avif';
    await warmCachedEmoteRefs([pinnedUrl], { pin: true });
    await warmCachedEmoteRefs([unpinnedUrl]);

    trimDecodedEmotes('reclaim');

    expect(getCachedEmoteRef(pinnedUrl)).toEqual({});
    expect(getCachedEmoteRef(unpinnedUrl)).toBeNull();
    expect(Image.clearMemoryCache).toHaveBeenCalledTimes(1);
  });

  test('advisory trims throttle the image-cache wipe; reclaim trims bypass it', () => {
    let now = Date.now() + 60_000;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);

    try {
      trimDecodedEmotes('advisory');
      trimDecodedEmotes('advisory');
      expect(Image.clearMemoryCache).toHaveBeenCalledTimes(1);

      // memoryWarning/backgrounding path: unthrottled even inside the window.
      trimDecodedEmotes('reclaim');
      expect(Image.clearMemoryCache).toHaveBeenCalledTimes(2);

      now += 31_000;
      trimDecodedEmotes('advisory');
      expect(Image.clearMemoryCache).toHaveBeenCalledTimes(3);
    } finally {
      nowSpy.mockRestore();
    }
  });

  test('eviction drops the least-recently-touched unpinned ref', async () => {
    const urls = Array.from(
      { length: 2400 },
      (_, i) => `https://cdn.7tv.app/emote/lru${i}/2x_static.avif`,
    );
    await warmCachedEmoteRefs(urls);
    expect(getCachedEmoteStats().decoded).toBe(2400);

    // Mark the oldest-decoded entry as most-recently-used.
    touchCachedEmoteRef(urls[0]!);
    // One more decode trips the cap and evicts the now-oldest unpinned entry.
    await warmCachedEmoteRefs([
      'https://cdn.7tv.app/emote/lruExtra/2x_static.avif',
    ]);

    expect(getCachedEmoteStats().decoded).toBe(2400);
    expect(getCachedEmoteRef(urls[0]!)).toEqual({});
    expect(getCachedEmoteRef(urls[1]!)).toBeNull();
  });

  test('evicts to stay under the decoded-byte budget before the entry-count cap', async () => {
    // Animated decodes cost 8x a static one, so the byte budget caps the cache
    // far below the 2400-entry count backstop.
    loadAsync.mockResolvedValue(animatedRef());

    const urls = Array.from(
      { length: 1600 },
      (_, i) => `https://cdn.7tv.app/emote/big${i}/2x.avif`,
    );
    await warmCachedEmoteRefs(urls);

    expect(getCachedEmoteStats().decoded).toBe(
      HIGH_TIER_BYTE_BUDGET_ANIMATED_ENTRIES,
    );
    expect(getCachedEmoteByteEstimate()).toBeLessThanOrEqual(
      MAX_DECODED_BYTES_HIGH_TIER,
    );
    // The most-recently warmed ref survives; the oldest was evicted to fit.
    expect(getCachedEmoteRef(urls.at(-1)!)).toEqual(animatedRef());
    expect(getCachedEmoteRef(urls[0]!)).toBeNull();
  });

  test('the byte budget never evicts a ref a mounted row is still subscribed to', async () => {
    loadAsync.mockResolvedValue(animatedRef());
    const mountedUrl = 'https://cdn.7tv.app/emote/bigMounted/2x.avif';
    await warmCachedEmoteRefs([mountedUrl]);
    const unsubscribe = subscribeCachedEmoteRef(mountedUrl, jest.fn());

    const unsubscribedUrl = 'https://cdn.7tv.app/emote/bigUnsubscribed/2x.avif';
    await warmCachedEmoteRefs([unsubscribedUrl]);

    await warmCachedEmoteRefs(
      Array.from(
        { length: 1600 },
        (_, i) => `https://cdn.7tv.app/emote/bigChurn${i}/2x.avif`,
      ),
    );

    // Evicting the subscribed url would free nothing and only un-count its bytes,
    // so the scan sheds an unsubscribed one instead.
    expect(getCachedEmoteRef(mountedUrl)).toEqual(animatedRef());
    expect(getCachedEmoteRef(unsubscribedUrl)).toBeNull();
    expect(getCachedEmoteByteEstimate()).toBeLessThanOrEqual(
      MAX_DECODED_BYTES_HIGH_TIER,
    );
    unsubscribe();
  });

  test('a memory-pressure trim frees a bitmap even while a row is still subscribed', async () => {
    const url = 'https://cdn.7tv.app/emote/pressure/2x.avif';
    const release = jest.fn();
    loadAsync.mockResolvedValueOnce(makeImageRef({ release }));
    await warmCachedEmoteRefs([url]);
    const unsubscribe = subscribeCachedEmoteRef(url, jest.fn());

    releaseChannelEmoteRefs();
    await flushAnimationFrames();

    // The trim notified first, so the row has already dropped to its uri fallback.
    expect(release).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test('an advisory trim keeps refs mounted rows are subscribed to', async () => {
    const mountedUrl = 'https://cdn.7tv.app/emote/advMounted/2x.avif';
    const offscreenUrl = 'https://cdn.7tv.app/emote/advOffscreen/2x.avif';
    await warmCachedEmoteRefs([mountedUrl, offscreenUrl]);
    const unsubscribe = subscribeCachedEmoteRef(mountedUrl, jest.fn());

    trimDecodedEmotes('advisory');

    expect(getCachedEmoteRef(mountedUrl)).toEqual({});
    expect(getCachedEmoteRef(offscreenUrl)).toBeNull();
    unsubscribe();
  });

  test('the byte budget never evicts pinned refs', async () => {
    loadAsync.mockResolvedValue(animatedRef());
    const pinnedUrl = 'https://cdn.7tv.app/emote/bigPinned/2x.avif';
    await warmCachedEmoteRefs([pinnedUrl], { pin: true });

    const unpinned = Array.from(
      { length: 1600 },
      (_, i) => `https://cdn.7tv.app/emote/bigUnpinned${i}/2x.avif`,
    );
    await warmCachedEmoteRefs(unpinned);

    // Warming far past the byte budget evicts unpinned refs but never the pin.
    expect(getCachedEmoteRef(pinnedUrl)).toEqual(animatedRef());
    expect(getCachedEmoteStats().pinned).toBe(1);
  });

  test('clearing the cache resets the byte estimate', async () => {
    loadAsync.mockResolvedValue(animatedRef());
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
          releases.push(() => resolve(makeImageRef()));
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

    releases.forEach(release => release());
    await flushMicrotasks();
  });

  test('visible render decodes preempt queued warm decodes when slots are saturated', async () => {
    const decodedUrls: string[] = [];
    const releases: (() => void)[] = [];
    loadAsync.mockImplementation(source => {
      decodedUrls.push(decodedUri(source));
      return new Promise<ImageRef>(resolve => {
        releases.push(() => resolve(makeImageRef()));
      });
    });

    const saturatingWarmUrls = Array.from(
      { length: 8 },
      (_, i) => `https://cdn.7tv.app/emote/warmfill${i}/2x.avif`,
    );
    void warmCachedEmoteRefs(saturatingWarmUrls);

    const queuedWarmUrls = Array.from(
      { length: 3 },
      (_, i) => `https://cdn.7tv.app/emote/warmqueue${i}/2x.avif`,
    );
    void warmCachedEmoteRefs(queuedWarmUrls);

    const renderUrl = 'https://cdn.7tv.app/emote/render/2x.avif';
    ensureCachedEmoteRef(renderUrl);
    await flushMicrotasks();

    const saturatedSlotCount = decodedUrls.length;
    expect(saturatedSlotCount).toBeGreaterThan(0);
    expect(decodedUrls).not.toContain(renderUrl);

    releases[0]!();
    await flushMicrotasks();

    expect(decodedUrls[saturatedSlotCount]).toBe(renderUrl);

    let releaseIndex = 0;
    while (releaseIndex < releases.length) {
      releases[releaseIndex]!();
      releaseIndex += 1;
      await flushMicrotasks();
    }
  });

  test('promotes a queued warm decode to normal priority when it becomes visible', async () => {
    const decodedUrls: string[] = [];
    const releases: (() => void)[] = [];
    loadAsync.mockImplementation(source => {
      decodedUrls.push(decodedUri(source));
      return new Promise<ImageRef>(resolve => {
        releases.push(() => resolve(makeImageRef()));
      });
    });

    const saturatingWarmUrls = Array.from(
      { length: 8 },
      (_, i) => `https://cdn.7tv.app/emote/promotefill${i}/2x.avif`,
    );
    void warmCachedEmoteRefs(saturatingWarmUrls);

    const promotedUrl = 'https://cdn.7tv.app/emote/promoted/2x.avif';
    void warmCachedEmoteRefs([
      'https://cdn.7tv.app/emote/promoteq0/2x.avif',
      promotedUrl,
      'https://cdn.7tv.app/emote/promoteq1/2x.avif',
    ]);
    await flushMicrotasks();

    const saturatedSlotCount = decodedUrls.length;
    expect(decodedUrls).not.toContain(promotedUrl);

    ensureCachedEmoteRef(promotedUrl);

    releases[0]!();
    await flushMicrotasks();

    expect(decodedUrls[saturatedSlotCount]).toBe(promotedUrl);

    let releaseIndex = 0;
    while (releaseIndex < releases.length) {
      releases[releaseIndex]!();
      releaseIndex += 1;
      await flushMicrotasks();
    }
  });
});
