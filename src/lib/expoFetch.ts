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
   *  Yield a macrotask so the native NativeResponse state transitions (and the
   * JSI Promise releases they trigger) flush on the JS thread before the caller
   * tears the runtime down.
   */
  await nextMacrotask();
}
