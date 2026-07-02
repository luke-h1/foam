import { createSevenTvUserIdCache } from '../sevenTvUserIdCache';
import { createFakeStorage } from './__fixtures__/sevenTvUserIdCache.fixture';

describe('sevenTvUserIdCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('resolves a miss through the fetcher and persists the result', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserIdCache(storage);
    const fetchUserId = jest.fn(async () => 'stv-1');

    const userId = await cache.resolve('123', fetchUserId);

    expect(userId).toEqual('stv-1');
    expect(fetchUserId.mock.calls).toEqual([['123']]);
    expect(
      storage.backing.get('seven_tv_cache_sevenTvUserId_user-id:123'),
    ).toEqual({
      expiry: '2026-07-01T12:00:00.000Z',
      value: {
        expiresAt: new Date('2026-07-01T12:00:00.000Z').getTime(),
        userId: 'stv-1',
      },
    });
  });

  test('serves repeat lookups from memory without refetching', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserIdCache(storage);
    const fetchUserId = jest.fn(async () => 'stv-1');

    const first = await cache.resolve('123', fetchUserId);
    const second = await cache.resolve('123', fetchUserId);

    expect([first, second]).toEqual(['stv-1', 'stv-1']);
    expect(fetchUserId.mock.calls).toEqual([['123']]);
  });

  test('serves persisted lookups to a fresh cache instance without refetching', async () => {
    const storage = createFakeStorage();
    const firstCache = createSevenTvUserIdCache(storage);
    const fetchUserId = jest.fn(async () => 'stv-1');

    await firstCache.resolve('123', fetchUserId);

    const secondCache = createSevenTvUserIdCache(storage);
    const secondFetchUserId = jest.fn(async () => 'stv-other');

    const userId = await secondCache.resolve('123', secondFetchUserId);

    expect(userId).toEqual('stv-1');
    expect(secondFetchUserId.mock.calls).toEqual([]);
  });

  test('dedupes concurrent lookups into a single fetch', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserIdCache(storage);
    let resolveFetch: ((userId: string) => void) | undefined;
    const fetchUserId = jest.fn(
      () =>
        new Promise<string>(resolve => {
          resolveFetch = resolve;
        }),
    );

    const first = cache.resolve('123', fetchUserId);
    const second = cache.resolve('123', fetchUserId);
    resolveFetch?.('stv-1');

    const results = await Promise.all([first, second]);

    expect(results).toEqual(['stv-1', 'stv-1']);
    expect(fetchUserId.mock.calls).toEqual([['123']]);
  });

  test('evicts the oldest in-memory entry once the bound is reached', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserIdCache(storage, { maxResolvedEntries: 2 });
    const fetchUserId = jest.fn(
      async (twitchUserId: string) => `stv-${twitchUserId}`,
    );

    await cache.resolve('a', fetchUserId);
    await cache.resolve('b', fetchUserId);
    await cache.resolve('c', fetchUserId);

    storage.backing.clear();

    const fromMemory = [
      await cache.resolve('b', fetchUserId),
      await cache.resolve('c', fetchUserId),
    ];
    const refetched = await cache.resolve('a', fetchUserId);

    expect(fromMemory).toEqual(['stv-b', 'stv-c']);
    expect(refetched).toEqual('stv-a');
    expect(fetchUserId.mock.calls).toEqual([['a'], ['b'], ['c'], ['a']]);
  });

  test('caches an empty resolution and refetches after the negative TTL', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserIdCache(storage);
    const fetchUserId = jest.fn(async () => '');

    const first = await cache.resolve('123', fetchUserId);

    expect(
      storage.backing.get('seven_tv_cache_sevenTvUserId_user-id:123'),
    ).toEqual({
      expiry: '2026-07-01T00:30:00.000Z',
      value: {
        expiresAt: new Date('2026-07-01T00:30:00.000Z').getTime(),
        userId: '',
      },
    });

    jest.setSystemTime(new Date('2026-07-01T00:29:00.000Z'));
    const second = await cache.resolve('123', fetchUserId);

    jest.setSystemTime(new Date('2026-07-01T00:31:00.000Z'));
    fetchUserId.mockImplementation(async () => 'stv-9');
    const third = await cache.resolve('123', fetchUserId);

    expect([first, second, third]).toEqual(['', '', 'stv-9']);
    expect(fetchUserId.mock.calls).toEqual([['123'], ['123']]);
  });

  test('does not cache a failed lookup', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserIdCache(storage);
    const fetchUserId = jest.fn(async (): Promise<string | null> => null);

    const first = await cache.resolve('123', fetchUserId);

    expect(first).toEqual('');
    expect(storage.backing).toEqual(new Map());

    fetchUserId.mockImplementation(async () => 'stv-1');
    const second = await cache.resolve('123', fetchUserId);

    expect(second).toEqual('stv-1');
    expect(fetchUserId.mock.calls).toEqual([['123'], ['123']]);
  });

  test('clear drops both memory and persisted entries', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserIdCache(storage);
    const fetchUserId = jest.fn(async () => 'stv-1');

    await cache.resolve('123', fetchUserId);
    cache.clear();

    expect(storage.backing).toEqual(new Map());

    const userId = await cache.resolve('123', fetchUserId);

    expect(userId).toEqual('stv-1');
    expect(fetchUserId.mock.calls).toEqual([['123'], ['123']]);
  });
});
