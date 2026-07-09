import { fetch as expoFetch } from 'expo/fetch';

/**
 * Thin wrapper around `expo/fetch` that tracks every in-flight request so they
 * can be drained before the JSI runtime is torn down.
 *
 * An OTA `reloadAsync()` frees the JavaScript runtime. If an `expo/fetch`
 * request is still in flight, its native `NativeResponse` later settles and
 * dereferences the (now freed) runtime through its live JSI Promise, crashing
 * in `facebook::jsi::Pointer::~Pointer` (EXC_BAD_ACCESS). Draining first -
 * aborting outstanding requests and awaiting their settlement while the runtime
 * is still alive - keeps that teardown on the JS thread where it is safe.
 */

type ExpoFetchParams = Parameters<typeof expoFetch>;
type ExpoFetchReturn = ReturnType<typeof expoFetch>;

const inFlight = new Set<ExpoFetchReturn>();
const controllers = new Set<AbortController>();

/**
 * Upper bound on how long `drainInFlightExpoFetches` waits for aborted requests
 * to settle. Requests carry their own timeouts, but a stalled connection must
 * not block an OTA reload indefinitely.
 */
const DRAIN_TIMEOUT_MS = 1_500;

/**
 * Extra event-loop turns after aborted requests settle so NativeResponse can
 * release its JSI Promise handles on the JS thread before reloadAsync runs.
 */
const DRAIN_MACROTASK_YIELDS = 3;

function nextMacrotask(): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });
}

export function fetch(...[input, init]: ExpoFetchParams): ExpoFetchReturn {
  const controller = new AbortController();
  controllers.add(controller);

  /**
   * Chain the caller's signal into ours so caller-side aborts still work while
   * we retain a central handle to abort on drain.
   */
  const callerSignal = init?.signal ?? undefined;
  const onCallerAbort = () => {
    controller.abort();
  };
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener('abort', onCallerAbort);
    }
  }

  const promise = expoFetch(input, {
    ...init,
    signal: controller.signal,
  });
  inFlight.add(promise);

  const cleanup = () => {
    inFlight.delete(promise);
    controllers.delete(controller);
    callerSignal?.removeEventListener('abort', onCallerAbort);
  };
  promise.then(cleanup, cleanup);

  return promise;
}

/**
 * Abort every in-flight `expo/fetch` request and wait for them to settle,
 * bounded by `DRAIN_TIMEOUT_MS`. Call this immediately before `reloadAsync()`
 * so no native response settles against a torn-down runtime.
 */
export async function drainInFlightExpoFetches(): Promise<void> {
  if (inFlight.size > 0) {
    for (const controller of controllers) {
      controller.abort();
    }

    await Promise.race([
      Promise.allSettled([...inFlight]),
      new Promise<void>(resolve => {
        setTimeout(resolve, DRAIN_TIMEOUT_MS);
      }),
    ]);
  }

  /**
   * Yield macrotasks so native NativeResponse state transitions (and the JSI
   * Promise releases they trigger) flush on the JS thread before the caller
   * tears the runtime down.
   */
  for (let i = 0; i < DRAIN_MACROTASK_YIELDS; i += 1) {
    await nextMacrotask();
  }
}

let trackedFetchInstalled = false;

/**
 * SDK 57 replaces `globalThis.fetch` with `expo/fetch`. Any bare `fetch()` call
 * bypasses the in-flight tracker unless we re-wrap the global. Install once at
 * app startup, before other modules issue network requests.
 */
export function installTrackedExpoFetch(): void {
  if (trackedFetchInstalled) {
    return;
  }

  const useRnFetch =
    process.env.EXPO_PUBLIC_USE_RN_FETCH === '1' ||
    process.env.EXPO_PUBLIC_USE_RN_FETCH === 'true';

  if (useRnFetch || typeof globalThis.fetch === 'undefined') {
    return;
  }

  globalThis.fetch = fetch as typeof globalThis.fetch;
  trackedFetchInstalled = true;
}
