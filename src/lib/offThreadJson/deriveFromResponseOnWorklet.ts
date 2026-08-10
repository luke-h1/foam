import { runOnRuntimeAsync } from 'react-native-worklets';

import { getParseRuntime } from '@app/lib/offThreadJson/getParseRuntime';
import { logger } from '@app/utils/logger';

/**
 * Below this size the round trip (copy the string over, schedule, copy the
 * result back) costs more than the parse itself - and the first oversized
 * body is what spawns the worklet runtime, so small early responses (token
 * refresh, the first followed-streams page on boot) no longer pay a runtime +
 * thread spawn on the startup critical path.
 */
const MIN_OFF_THREAD_BODY_BYTES = 64 * 1024;

/**
 * Derives a result from a network response body on a background worklet thread
 * via `derive` (a worklet returning only what the caller needs), falling back
 * to the JS thread when the runtime is unavailable.
 */
export async function deriveFromResponseOnWorklet<TResult>(
  responseText: string,
  derive: (responseText: string) => TResult,
): Promise<TResult> {
  if (responseText.length < MIN_OFF_THREAD_BODY_BYTES) {
    return derive(responseText);
  }
  const runtime = getParseRuntime();
  if (runtime) {
    try {
      return await runOnRuntimeAsync(runtime, derive, responseText);
    } catch (error) {
      logger.main.debug('off-thread parse failed; parsing on JS thread', {
        error,
      });
    }
  }
  return derive(responseText);
}
