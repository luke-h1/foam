export interface FetchOnceGuardOptions {
  /**
   * Freshness window for fetched stamps. When omitted, a stamped key stays
   * fetched for the rest of the session (until `clear`/`clearKey`).
   */
  ttlMs?: number;
  /**
   * Cap on concurrently running fetchers; runs beyond the cap queue in FIFO
   * order. When omitted, fetchers run immediately.
   */
  maxConcurrent?: number;
}

export interface FetchOnceRunContext {
  /**
   * False once `clear` has run after this fetch started. Fetchers use this to
   * skip cache write-backs that would resurrect just-cleared state.
   */
  stillCurrent(): boolean;
  /**
   * Stamps a key as fetched, defaulting to the run key. No-ops once `clear`
   * has run after this fetch started, so a completing fetch cannot re-poison
   * a freshly cleared guard.
   */
  markFetched(key?: string): void;
}

export interface FetchOnceGuard {
  /**
   * Single-flight fetch: concurrent runs for the same key share one promise.
   * Does not stamp the key; stamping is the fetcher's decision via
   * `ctx.markFetched`. Rejections propagate to every caller.
   */
  run<V>(
    key: string,
    fetcher: (ctx: FetchOnceRunContext) => Promise<V>,
  ): Promise<V>;
  isInFlight(key: string): boolean;
  hasFetched(key: string): boolean;
  /**
   * True when the key is neither in flight nor carrying a fresh stamp.
   */
  shouldFetch(key: string): boolean;
  markFetched(key: string): void;
  clearKey(key: string): void;
  /**
   * Drops all stamps and in-flight tracking and fences out fetches that are
   * still running: their `stillCurrent` turns false and their `markFetched`
   * becomes a no-op.
   */
  clear(): void;
}

export const createFetchOnceGuard = (
  options: FetchOnceGuardOptions = {},
): FetchOnceGuard => {
  const { ttlMs, maxConcurrent } = options;

  if (maxConcurrent !== undefined && maxConcurrent < 1) {
    throw new RangeError(
      'createFetchOnceGuard: maxConcurrent must be greater than or equal to 1',
    );
  }

  const inFlight = new Map<string, Promise<unknown>>();
  const fetchedAt = new Map<string, number>();
  let generation = 0;

  let activeFetches = 0;
  const fetchQueue: (() => void)[] = [];

  const acquireSlot = (): Promise<void> => {
    if (maxConcurrent === undefined || activeFetches < maxConcurrent) {
      activeFetches += 1;
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      fetchQueue.push(resolve);
    });
  };

  const releaseSlot = (): void => {
    const next = fetchQueue.shift();
    if (next) {
      next();
    } else {
      activeFetches -= 1;
    }
  };

  const hasFetched = (key: string): boolean => {
    const at = fetchedAt.get(key);
    if (at === undefined) {
      return false;
    }
    return ttlMs === undefined || Date.now() - at < ttlMs;
  };

  const run = <V>(
    key: string,
    fetcher: (ctx: FetchOnceRunContext) => Promise<V>,
  ): Promise<V> => {
    const pending = inFlight.get(key);
    if (pending) {
      return pending as Promise<V>;
    }

    const runGeneration = generation;
    const ctx: FetchOnceRunContext = {
      stillCurrent: () => generation === runGeneration,
      markFetched: (stampKey = key) => {
        if (generation === runGeneration) {
          fetchedAt.set(stampKey, Date.now());
        }
      },
    };

    const request =
      maxConcurrent === undefined
        ? fetcher(ctx)
        : acquireSlot().then(() => {
            try {
              return fetcher(ctx).finally(releaseSlot);
            } catch (error) {
              releaseSlot();
              throw error;
            }
          });

    inFlight.set(key, request);
    const cleanup = () => {
      if (inFlight.get(key) === request) {
        inFlight.delete(key);
      }
    };
    request.then(cleanup, cleanup);
    return request;
  };

  return {
    run,
    isInFlight: key => inFlight.has(key),
    hasFetched,
    shouldFetch: key => !inFlight.has(key) && !hasFetched(key),
    markFetched: key => {
      fetchedAt.set(key, Date.now());
    },
    clearKey: key => {
      fetchedAt.delete(key);
      inFlight.delete(key);
    },
    clear: () => {
      generation += 1;
      fetchedAt.clear();
      inFlight.clear();
    },
  };
};
