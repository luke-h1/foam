import { runOnRuntimeAsync } from 'react-native-worklets';

import { getParseRuntime } from '@app/lib/off-thread-json/getParseRuntime';

/**
 * Below this size the worklet round trip costs more than the parse, so small
 * boot responses skip the runtime + thread spawn.
 */
const MIN_OFF_THREAD_BODY_BYTES = 64 * 1024;

export async function deriveFromResponseOnWorklet<TResult>(
  responseText: string,
  derive: (responseText: string) => TResult,
): Promise<TResult> {
  if (responseText.length < MIN_OFF_THREAD_BODY_BYTES) {
    return derive(responseText);
  }

  const runtime = getParseRuntime();

  if (runtime) {
    return runOnRuntimeAsync(runtime, derive, responseText);
  }

  return derive(responseText);
}
