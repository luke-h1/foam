import type { SevenTvUser } from '../sevenTvUserCache';
import { createSevenTvUserCache } from '../sevenTvUserCache';
import { createFakeStorage } from './__fixtures__/sevenTvUserCache.fixture';

const sevenTvUser = (userId: string, emoteSetId = `set-${userId}`) =>
  ({ userId, emoteSetId }) satisfies SevenTvUser;

describe('sevenTvUserCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('resolves a miss through the fetcher and persists the result', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserCache(storage);
    const fetchUser = jest.fn(async () => sevenTvUser('stv-1'));

    const user = await cache.resolve('123', fetchUser);

    expect(user).toEqual<SevenTvUser>({
      userId: 'stv-1',
      emoteSetId: 'set-stv-1',
    });
    expect(fetchUser.mock.calls).toEqual([['123']]);
    expect(
      storage.backing.get('seven_tv_cache_sevenTvUserId_user:v2:123'),
    ).toEqual({
      expiry: '2026-07-01T12:00:00.000Z',
      value: {
        expiresAt: new Date('2026-07-01T12:00:00.000Z').getTime(),
        userId: 'stv-1',
        emoteSetId: 'set-stv-1',
      },
    });
  });

  test('caches a user with no active emote set for the full positive TTL', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserCache(storage);
    const fetchUser = jest.fn(async () => sevenTvUser('stv-1', ''));

    const first = await cache.resolve('123', fetchUser);

    jest.setSystemTime(new Date('2026-07-01T11:59:00.000Z'));
    const second = await cache.resolve('123', fetchUser);

    expect([first, second]).toEqual<SevenTvUser[]>([
      { userId: 'stv-1', emoteSetId: '' },
      { userId: 'stv-1', emoteSetId: '' },
    ]);
    expect(fetchUser.mock.calls).toEqual([['123']]);
  });

  test('ignores entries written under the previous cache key', async () => {
    const storage = createFakeStorage();
    storage.backing.set('seven_tv_cache_sevenTvUserId_user-id:123', {
      expiry: '2026-07-01T12:00:00.000Z',
      value: {
        expiresAt: new Date('2026-07-01T12:00:00.000Z').getTime(),
        userId: 'stv-stale',
      },
    });
    const cache = createSevenTvUserCache(storage);
    const fetchUser = jest.fn(async () => sevenTvUser('stv-1'));

    const user = await cache.resolve('123', fetchUser);

    expect(user).toEqual<SevenTvUser>({
      userId: 'stv-1',
      emoteSetId: 'set-stv-1',
    });
    expect(fetchUser.mock.calls).toEqual([['123']]);
  });

  test('serves repeat lookups from memory without refetching', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserCache(storage);
    const fetchUser = jest.fn(async () => sevenTvUser('stv-1'));

    const first = await cache.resolve('123', fetchUser);
    const second = await cache.resolve('123', fetchUser);

    expect([first, second]).toEqual<SevenTvUser[]>([
      { userId: 'stv-1', emoteSetId: 'set-stv-1' },
      { userId: 'stv-1', emoteSetId: 'set-stv-1' },
    ]);
    expect(fetchUser.mock.calls).toEqual([['123']]);
  });

  test('serves persisted lookups to a fresh cache instance without refetching', async () => {
    const storage = createFakeStorage();
    const firstCache = createSevenTvUserCache(storage);
    const fetchUser = jest.fn(async () => sevenTvUser('stv-1'));

    await firstCache.resolve('123', fetchUser);

    const secondCache = createSevenTvUserCache(storage);
    const secondFetchUser = jest.fn(async () => sevenTvUser('stv-other'));

    const user = await secondCache.resolve('123', secondFetchUser);

    expect(user).toEqual<SevenTvUser>({
      userId: 'stv-1',
      emoteSetId: 'set-stv-1',
    });
    expect(secondFetchUser.mock.calls).toEqual([]);
  });

  test('dedupes concurrent lookups into a single fetch', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserCache(storage);
    let resolveFetch: ((user: SevenTvUser) => void) | undefined;
    const fetchUser = jest.fn(
      () =>
        new Promise<SevenTvUser>(resolve => {
          resolveFetch = resolve;
        }),
    );

    const first = cache.resolve('123', fetchUser);
    const second = cache.resolve('123', fetchUser);
    resolveFetch?.(sevenTvUser('stv-1'));

    const results = await Promise.all([first, second]);

    expect(results).toEqual<SevenTvUser[]>([
      { userId: 'stv-1', emoteSetId: 'set-stv-1' },
      { userId: 'stv-1', emoteSetId: 'set-stv-1' },
    ]);
    expect(fetchUser.mock.calls).toEqual([['123']]);
  });

  test('evicts the oldest in-memory entry once the bound is reached', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserCache(storage, { maxResolvedEntries: 2 });
    const fetchUser = jest.fn(async (twitchUserId: string) =>
      sevenTvUser(`stv-${twitchUserId}`),
    );

    await cache.resolve('a', fetchUser);
    await cache.resolve('b', fetchUser);
    await cache.resolve('c', fetchUser);

    storage.backing.clear();

    const fromMemory = [
      await cache.resolve('b', fetchUser),
      await cache.resolve('c', fetchUser),
    ];
    const refetched = await cache.resolve('a', fetchUser);

    expect(fromMemory).toEqual<SevenTvUser[]>([
      { userId: 'stv-b', emoteSetId: 'set-stv-b' },
      { userId: 'stv-c', emoteSetId: 'set-stv-c' },
    ]);
    expect(refetched).toEqual<SevenTvUser>({
      userId: 'stv-a',
      emoteSetId: 'set-stv-a',
    });
    expect(fetchUser.mock.calls).toEqual([['a'], ['b'], ['c'], ['a']]);
  });

  test('caches an empty resolution and refetches after the negative TTL', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserCache(storage);
    const fetchUser = jest.fn(async () => sevenTvUser('', ''));

    const first = await cache.resolve('123', fetchUser);

    expect(
      storage.backing.get('seven_tv_cache_sevenTvUserId_user:v2:123'),
    ).toEqual({
      expiry: '2026-07-01T00:30:00.000Z',
      value: {
        expiresAt: new Date('2026-07-01T00:30:00.000Z').getTime(),
        userId: '',
        emoteSetId: '',
      },
    });

    jest.setSystemTime(new Date('2026-07-01T00:29:00.000Z'));
    const second = await cache.resolve('123', fetchUser);

    jest.setSystemTime(new Date('2026-07-01T00:31:00.000Z'));
    fetchUser.mockImplementation(async () => sevenTvUser('stv-9'));
    const third = await cache.resolve('123', fetchUser);

    expect([first, second, third]).toEqual<SevenTvUser[]>([
      { userId: '', emoteSetId: '' },
      { userId: '', emoteSetId: '' },
      { userId: 'stv-9', emoteSetId: 'set-stv-9' },
    ]);
    expect(fetchUser.mock.calls).toEqual([['123'], ['123']]);
  });

  test('does not cache a failed lookup', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserCache(storage);
    const fetchUser = jest.fn(async (): Promise<SevenTvUser | null> => null);

    const first = await cache.resolve('123', fetchUser);

    expect(first).toEqual<SevenTvUser>({ userId: '', emoteSetId: '' });
    expect(storage.backing).toEqual(new Map());

    fetchUser.mockImplementation(async () => sevenTvUser('stv-1'));
    const second = await cache.resolve('123', fetchUser);

    expect(second).toEqual<SevenTvUser>({
      userId: 'stv-1',
      emoteSetId: 'set-stv-1',
    });
    expect(fetchUser.mock.calls).toEqual([['123'], ['123']]);
  });

  test('clear drops both memory and persisted entries', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserCache(storage);
    const fetchUser = jest.fn(async () => sevenTvUser('stv-1'));

    await cache.resolve('123', fetchUser);
    cache.clear();

    expect(storage.backing).toEqual(new Map());

    const user = await cache.resolve('123', fetchUser);

    expect(user).toEqual<SevenTvUser>({
      userId: 'stv-1',
      emoteSetId: 'set-stv-1',
    });
    expect(fetchUser.mock.calls).toEqual([['123'], ['123']]);
  });

  test('a resolve in flight during clear does not repopulate the cache', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserCache(storage);
    let resolveFetch: ((user: SevenTvUser) => void) | undefined;
    const fetchUser = jest.fn(
      () =>
        new Promise<SevenTvUser>(resolve => {
          resolveFetch = resolve;
        }),
    );

    const inFlight = cache.resolve('123', fetchUser);
    cache.clear();
    resolveFetch?.(sevenTvUser('stv-stale'));

    const inFlightResult = await inFlight;

    expect(inFlightResult).toEqual<SevenTvUser>({
      userId: 'stv-stale',
      emoteSetId: 'set-stv-stale',
    });
    expect(storage.backing).toEqual(new Map());

    fetchUser.mockImplementation(async () => sevenTvUser('stv-fresh'));
    const refetched = await cache.resolve('123', fetchUser);

    expect(refetched).toEqual<SevenTvUser>({
      userId: 'stv-fresh',
      emoteSetId: 'set-stv-fresh',
    });
    expect(fetchUser.mock.calls).toEqual([['123'], ['123']]);
  });

  test('a stale resolve settling after clear keeps deduping the newer request', async () => {
    const storage = createFakeStorage();
    const cache = createSevenTvUserCache(storage);
    const pendingFetches: ((user: SevenTvUser) => void)[] = [];
    const fetchUser = jest.fn(
      () =>
        new Promise<SevenTvUser>(resolve => {
          pendingFetches.push(resolve);
        }),
    );

    const stale = cache.resolve('123', fetchUser);
    cache.clear();
    const fresh = cache.resolve('123', fetchUser);

    pendingFetches[0]?.(sevenTvUser('stv-stale'));
    await stale;

    const deduped = cache.resolve('123', fetchUser);
    pendingFetches[1]?.(sevenTvUser('stv-fresh'));

    expect(await Promise.all([fresh, deduped])).toEqual<SevenTvUser[]>([
      { userId: 'stv-fresh', emoteSetId: 'set-stv-fresh' },
      { userId: 'stv-fresh', emoteSetId: 'set-stv-fresh' },
    ]);
    expect(fetchUser.mock.calls).toEqual([['123'], ['123']]);
  });
});
