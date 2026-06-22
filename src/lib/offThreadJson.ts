import {
  createWorkletRuntime,
  runOnRuntimeAsync,
  type WorkletRuntime,
} from 'react-native-worklets';

import { logger } from '@app/utils/logger';

let parseRuntime: WorkletRuntime | null | undefined;

function getParseRuntime(): WorkletRuntime | null {
  if (parseRuntime !== undefined) {
    return parseRuntime;
  }
  try {
    parseRuntime = createWorkletRuntime('foam-json-parse');
  } catch (error) {
    parseRuntime = null;
    logger.main.debug('off-thread parse runtime unavailable', { error });
  }
  return parseRuntime;
}

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

/**
 * Parses a full JSON response body on a background worklet thread.
 */
export async function parseJsonOnWorklet<T>(responseText: string): Promise<T> {
  return deriveFromResponseOnWorklet(responseText, text => {
    'worklet';
    return JSON.parse(text) as T;
  });
}
