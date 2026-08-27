import { runOnRuntimeAsync } from 'react-native-worklets';

import { getParseRuntime } from '@app/lib/offThreadJson/getParseRuntime';
import { logger } from '@app/utils/logger';

/**
 * Below this size the worklet round trip costs more than the parse, so small
 * boot responses skip the runtime + thread spawn.
 */
const MIN_OFF_THREAD_BODY_BYTES = 64 * 1024;

/**
 * Derives a result from a response body on a background worklet thread,
 * falling back to the JS thread when the runtime is unavailable.
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
