import { runOnRuntimeAsync } from 'react-native-worklets';

import { getParseRuntime } from '@app/lib/offThreadJson/getParseRuntime';
import { logger } from '@app/utils/logger';

/**
 * Derives a result from a network response body on a background worklet thread
 * via `derive` (a worklet returning only what the caller needs), falling back
 * to the JS thread when the runtime is unavailable.
 */
export async function deriveFromResponseOnWorklet<TResult>(
  responseText: string,
  derive: (responseText: string) => TResult,
): Promise<TResult> {
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
