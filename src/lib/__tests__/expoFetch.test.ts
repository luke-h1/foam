import { drainInFlightExpoFetches, fetch } from '@app/lib/expoFetch';

const mockFetch = jest.fn();

jest.mock('expo/fetch', () => ({
  fetch: (...args: unknown[]) => mockFetch(...args) as Promise<unknown>,
}));

type DeferredFetch = {
  promise: Promise<unknown>;
  resolve: (value: unknown) => void;
  signal: AbortSignal;
};

/**
 * Kicks off a wrapped fetch whose underlying expo/fetch call stays pending
 * until the returned `resolve` is invoked, exposing the signal the wrapper
 * forwarded so tests can assert on abort behaviour.
 */
function startPendingFetch(callerSignal?: AbortSignal): DeferredFetch {
  let resolve!: (value: unknown) => void;
  const underlying = new Promise<unknown>(res => {
    resolve = res;
  });

  let capturedSignal!: AbortSignal;
  mockFetch.mockImplementationOnce(
    (_url: string, init: { signal: AbortSignal }) => {
      capturedSignal = init.signal;
      return underlying;
    },
  );

  const promise = fetch(
    'https://example.com',
    callerSignal ? { signal: callerSignal } : undefined,
  );

  return { promise, resolve, signal: capturedSignal };
}

afterEach(() => {
  mockFetch.mockReset();
  drainInFlightExpoFetches();
});

test('drain aborts an in-flight request and resolves once it settles', async () => {
  const pending = startPendingFetch();

  expect(pending.signal.aborted).toBe(false);

  const drained = drainInFlightExpoFetches();

  // Aborting happens synchronously when the drain starts.
  expect(pending.signal.aborted).toBe(true);

  // Let the aborted request settle the way expo/fetch would.
  pending.resolve(undefined);
  await pending.promise;

  await expect(drained).resolves.toBeUndefined();
});

test('drain resolves when there are no in-flight requests', async () => {
  await expect(drainInFlightExpoFetches()).resolves.toBeUndefined();
});

test('a caller abort still aborts the underlying request', async () => {
  const controller = new AbortController();
  const pending = startPendingFetch(controller.signal);

  expect(pending.signal.aborted).toBe(false);

  controller.abort();

  expect(pending.signal.aborted).toBe(true);

  pending.resolve(undefined);
  await pending.promise;
});
