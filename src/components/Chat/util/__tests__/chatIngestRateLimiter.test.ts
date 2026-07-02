type RateLimiterModule = typeof import('../chatIngestRateLimiter');

/**
 * The limiter keeps its token bucket in module state, so each test loads a
 * fresh copy to start from a full bucket.
 */
const loadLimiter = (): RateLimiterModule => {
  let limiter: RateLimiterModule | undefined;
  jest.isolateModules(() => {
    limiter = jest.requireActual<RateLimiterModule>('../chatIngestRateLimiter');
  });
  return limiter!;
};

describe('shouldProcessLiveMessage', () => {
  let nowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    nowSpy = jest.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  test('lets a 30-message burst through, then drops the 31st in the same instant', () => {
    const { shouldProcessLiveMessage } = loadLimiter();

    const results = Array.from({ length: 31 }, () =>
      shouldProcessLiveMessage(),
    );

    expect(results.slice(0, 30)).toEqual(
      Array.from({ length: 30 }, () => true),
    );
    expect(results[30]).toEqual(false);
  });

  test('refills at 150 tokens per second once the bucket is drained', () => {
    const { shouldProcessLiveMessage } = loadLimiter();
    Array.from({ length: 31 }, () => shouldProcessLiveMessage());

    nowSpy.mockReturnValue(1100);

    const results = Array.from({ length: 16 }, () =>
      shouldProcessLiveMessage(),
    );

    expect(results.slice(0, 15)).toEqual(
      Array.from({ length: 15 }, () => true),
    );
    expect(results[15]).toEqual(false);
  });

  test('never refills past the 30-token bucket after a long quiet gap', () => {
    const { shouldProcessLiveMessage } = loadLimiter();
    Array.from({ length: 30 }, () => shouldProcessLiveMessage());

    nowSpy.mockReturnValue(61_000);

    const results = Array.from({ length: 31 }, () =>
      shouldProcessLiveMessage(),
    );

    expect(results.slice(0, 30)).toEqual(
      Array.from({ length: 30 }, () => true),
    );
    expect(results[30]).toEqual(false);
  });
});
