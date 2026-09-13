type RateLimiterModule = typeof import('../chatIngestRateLimiter');

// The limiter keeps its token bucket in module state; load a fresh copy per test.
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

  test('lets a 60-message burst through, then drops the 61st in the same instant', () => {
    const { shouldProcessLiveMessage } = loadLimiter();

    const results = Array.from({ length: 61 }, () =>
      shouldProcessLiveMessage(),
    );

    expect(results.slice(0, 60)).toEqual(
      Array.from({ length: 60 }, () => true),
    );
    expect(results[60]).toEqual(false);
  });

  test('refills at 300 tokens per second once the bucket is drained', () => {
    const { shouldProcessLiveMessage } = loadLimiter();
    Array.from({ length: 61 }, () => shouldProcessLiveMessage());

    nowSpy.mockReturnValue(1100);

    const results = Array.from({ length: 31 }, () =>
      shouldProcessLiveMessage(),
    );

    expect(results.slice(0, 30)).toEqual(
      Array.from({ length: 30 }, () => true),
    );
    expect(results[30]).toEqual(false);
  });

  test('never refills past the 60-token bucket after a long quiet gap', () => {
    const { shouldProcessLiveMessage } = loadLimiter();
    Array.from({ length: 60 }, () => shouldProcessLiveMessage());

    nowSpy.mockReturnValue(61_000);

    const results = Array.from({ length: 61 }, () =>
      shouldProcessLiveMessage(),
    );

    expect(results.slice(0, 60)).toEqual(
      Array.from({ length: 60 }, () => true),
    );
    expect(results[60]).toEqual(false);
  });
});
