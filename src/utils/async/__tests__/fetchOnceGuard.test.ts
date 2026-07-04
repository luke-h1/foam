import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';

type Deferred<V> = {
  promise: Promise<V>;
  resolve: (value: V) => void;
  reject: (error: unknown) => void;
};

const deferred = <V>(): Deferred<V> => {
  let resolve!: (value: V) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<V>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('fetchOnceGuard single-flight', () => {
  test('concurrent runs for the same key share one fetcher call', async () => {
    const guard = createFetchOnceGuard();
    const gate = deferred<string>();
    const fetcher = jest.fn(() => gate.promise);

    const first = guard.run('key', fetcher);
    const second = guard.run('key', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(guard.isInFlight('key')).toEqual(true);

    gate.resolve('value');
    expect(await first).toEqual('value');
    expect(await second).toEqual('value');
    expect(guard.isInFlight('key')).toEqual(false);
  });

  test('a settled key can be fetched again', async () => {
    const guard = createFetchOnceGuard();
    const fetcher = jest.fn(() => Promise.resolve('value'));

    await guard.run('key', fetcher);
    await guard.run('key', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  test('a rejected run clears in-flight tracking and propagates the error', async () => {
    const guard = createFetchOnceGuard();

    await expect(
      guard.run('key', () => Promise.reject(new Error('nope'))),
    ).rejects.toThrow('nope');

    expect(guard.isInFlight('key')).toEqual(false);
  });

  test('runs for different keys do not dedupe each other', () => {
    const guard = createFetchOnceGuard();
    const fetcher = jest.fn(() => deferred<string>().promise);

    void guard.run('a', fetcher);
    void guard.run('b', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe('fetchOnceGuard stamps', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('without a ttl a stamp lasts until cleared', () => {
    const guard = createFetchOnceGuard();

    guard.markFetched('key');
    jest.setSystemTime(new Date('2027-01-01T00:00:00.000Z'));

    expect(guard.hasFetched('key')).toEqual(true);
    expect(guard.shouldFetch('key')).toEqual(false);

    guard.clearKey('key');
    expect(guard.shouldFetch('key')).toEqual(true);
  });

  test('with a ttl a stamp expires', () => {
    const guard = createFetchOnceGuard({ ttlMs: 1000 });

    guard.markFetched('key');
    expect(guard.shouldFetch('key')).toEqual(false);

    jest.setSystemTime(new Date('2026-01-01T00:00:01.000Z'));
    expect(guard.hasFetched('key')).toEqual(false);
    expect(guard.shouldFetch('key')).toEqual(true);
  });

  test('shouldFetch is false while a run is in flight', () => {
    const guard = createFetchOnceGuard();

    void guard.run('key', () => deferred<void>().promise);

    expect(guard.shouldFetch('key')).toEqual(false);
  });
});

describe('fetchOnceGuard generation fence', () => {
  test('clear during a run makes stillCurrent false and markFetched a no-op', async () => {
    const guard = createFetchOnceGuard();
    const gate = deferred<void>();
    let sawCurrent: boolean | null = null;

    const running = guard.run('key', async ctx => {
      await gate.promise;
      ctx.markFetched();
      ctx.markFetched('other-key');
      sawCurrent = ctx.stillCurrent();
    });

    guard.clear();
    gate.resolve();
    await running;

    expect(sawCurrent).toEqual(false);
    expect(guard.hasFetched('key')).toEqual(false);
    expect(guard.hasFetched('other-key')).toEqual(false);
  });

  test('without a clear the run context stamps normally', async () => {
    const guard = createFetchOnceGuard();

    await guard.run('key', async ctx => {
      ctx.markFetched();
      ctx.markFetched('other-key');
      expect(ctx.stillCurrent()).toEqual(true);
    });

    expect(guard.hasFetched('key')).toEqual(true);
    expect(guard.hasFetched('other-key')).toEqual(true);
  });

  test('clear releases in-flight dedup so the next run fetches fresh', async () => {
    const guard = createFetchOnceGuard();
    const firstGate = deferred<string>();
    const fetcher = jest.fn(() => firstGate.promise);

    const first = guard.run('key', fetcher);
    guard.clear();

    const second = guard.run('key', () => Promise.resolve('fresh'));

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(await second).toEqual('fresh');

    firstGate.resolve('stale');
    expect(await first).toEqual('stale');
    expect(guard.isInFlight('key')).toEqual(false);
  });
});

describe('fetchOnceGuard concurrency cap', () => {
  test('queues fetchers beyond the cap and starts them as slots free up', async () => {
    const guard = createFetchOnceGuard({ maxConcurrent: 2 });
    const gates = [deferred<void>(), deferred<void>(), deferred<void>()];
    const started: number[] = [];

    const runs = gates.map((gate, index) =>
      guard.run(`key-${index}`, () => {
        started.push(index);
        return gate.promise;
      }),
    );

    await Promise.resolve();
    expect(started).toEqual([0, 1]);

    gates[0]!.resolve();
    await runs[0];
    expect(started).toEqual([0, 1, 2]);

    gates[1]!.resolve();
    gates[2]!.resolve();
    await Promise.all(runs);
  });
});
