import { createMMKV } from 'react-native-mmkv';

import { ensureChannelCacheHydrated } from '../actions/channelCacheHydration';
import {
  clearPersistedChannelCaches,
  prunePersistedChannelCaches,
  readPersistedChannelCache,
} from '../observables/channelCachePersistence';
import { chatStore$ } from '../observables/chatStore';
import type { ChannelCacheType } from '../types/constants';
import { makeEmptyEmoteData, MAX_CACHED_CHANNELS } from '../types/constants';

const caches = createMMKV({ id: 'chat-channel-caches' });
const index = createMMKV({ id: 'chat-channel-cache-index' });

const makeCache = (lastUpdated: number): ChannelCacheType => ({
  ...makeEmptyEmoteData(),
  lastUpdated,
});

const flushWrites = () => {
  jest.advanceTimersByTime(250);
};

describe('channel cache persistence', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    chatStore$.persisted.channelCaches.set({});
    flushWrites();
    clearPersistedChannelCaches();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('writes one key per channel and coalesces writes', () => {
    chatStore$.persisted.channelCaches.set({ 'channel-1': makeCache(1) });
    chatStore$.persisted.channelCaches['channel-1']?.lastUpdated.set(2);

    expect(caches.getAllKeys()).toEqual([]);
    expect(index.getNumber('channel-1')).toEqual(2);

    flushWrites();

    expect(caches.getAllKeys()).toEqual(['channel-1']);
    expect(readPersistedChannelCache('channel-1')).toEqual<ChannelCacheType>(
      makeCache(2),
    );
  });

  test('a whole-map set only rewrites the channels whose entry changed', () => {
    const untouched = makeCache(1);
    chatStore$.persisted.channelCaches.set({ 'channel-1': untouched });
    flushWrites();
    caches.set('channel-1', 'sentinel');

    const current = chatStore$.persisted.channelCaches.peek();
    chatStore$.persisted.channelCaches.set({
      ...current,
      'channel-2': makeCache(2),
    });
    flushWrites();

    expect(caches.getString('channel-1')).toEqual('sentinel');
    expect(readPersistedChannelCache('channel-2')).toEqual<ChannelCacheType>(
      makeCache(2),
    );
  });

  test('removing a channel from the map removes its key', () => {
    chatStore$.persisted.channelCaches.set({
      'channel-1': makeCache(1),
      'channel-2': makeCache(2),
    });
    flushWrites();

    chatStore$.persisted.channelCaches.set({ 'channel-2': makeCache(2) });
    flushWrites();

    expect(caches.getAllKeys()).toEqual(['channel-2']);
    expect(index.getAllKeys()).toEqual(['channel-2']);
  });

  test('hydrates a persisted channel once and does not write it back', () => {
    caches.set('channel-1', JSON.stringify(makeCache(5)));
    index.set('channel-1', 5);

    ensureChannelCacheHydrated('channel-1');
    flushWrites();

    expect(
      chatStore$.persisted.channelCaches['channel-1']?.peek(),
    ).toEqual<ChannelCacheType>(makeCache(5));
    expect(caches.getString('channel-1')).toEqual(JSON.stringify(makeCache(5)));
  });

  test('hydration keeps in-memory data over disk', () => {
    chatStore$.persisted.channelCaches.set({ 'channel-1': makeCache(9) });
    caches.set('channel-1', JSON.stringify(makeCache(1)));

    ensureChannelCacheHydrated('channel-1');

    expect(
      chatStore$.persisted.channelCaches['channel-1']?.peek(),
    ).toEqual<ChannelCacheType>(makeCache(9));
  });

  test('a queued removal wins over the blob still on disk', () => {
    chatStore$.persisted.channelCaches.set({ 'channel-1': makeCache(1) });
    flushWrites();
    chatStore$.persisted.channelCaches.set({});

    ensureChannelCacheHydrated('channel-1');

    expect(chatStore$.persisted.channelCaches['channel-1']?.peek()).toEqual(
      undefined,
    );
  });

  test('drops a malformed blob instead of hydrating it', () => {
    caches.set('channel-1', '{not json');
    index.set('channel-1', 1);

    ensureChannelCacheHydrated('channel-1');

    expect(chatStore$.persisted.channelCaches['channel-1']?.peek()).toEqual(
      undefined,
    );
    expect(caches.getAllKeys()).toEqual([]);
    expect(index.getAllKeys()).toEqual([]);
  });

  test('prunes the oldest channels beyond the cap and keeps the current one', () => {
    for (let i = 0; i <= MAX_CACHED_CHANNELS; i += 1) {
      caches.set(`channel-${i}`, JSON.stringify(makeCache(i)));
      index.set(`channel-${i}`, i);
    }

    expect(prunePersistedChannelCaches('channel-0')).toEqual(['channel-1']);
    expect(index.getAllKeys()).toHaveLength(MAX_CACHED_CHANNELS);
    expect(caches.contains('channel-0')).toEqual(true);
    expect(caches.contains('channel-1')).toEqual(false);
  });
});
