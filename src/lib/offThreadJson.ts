import { logger } from '@app/utils/logger';
import {
  createWorkletRuntime,
  runOnRuntimeAsync,
  type WorkletRuntime,
} from 'react-native-worklets';

let parseRuntime: WorkletRuntime | null | undefined;

function getParseRuntime(): WorkletRuntime | null {
  if (parseRuntime !== undefined) {
    return parseRuntime;
  }
  try {
    parseRuntime = createWorkletRuntime('foam-json-parse');
  } catch (error) {
    parseRuntime = null;
    logger.main.debug('UI-thread parse runtime unavailable', { error });
  }
  return parseRuntime;
}

/**
 * Derives a result from a network response body on the UI thread via `derive`
 * (a worklet returning only what the caller needs), falling back to the JS
 * thread when the runtime is unavailable.
 */
export async function deriveFromResponseOnUIThread<TResult>(
  responseText: string,
  derive: (responseText: string) => TResult,
): Promise<TResult> {
  const runtime = getParseRuntime();
  if (runtime) {
    try {
      return await runOnRuntimeAsync(runtime, derive, responseText);
    } catch (error) {
      logger.main.debug('UI-thread parse failed; parsing on JS thread', {
        error,
      });
    }
  }
  return derive(responseText);
}

/**
 * Parses a full JSON response body on the UI thread.
 */
export async function parseJsonOnUIThread<T>(responseText: string): Promise<T> {
  return deriveFromResponseOnUIThread(responseText, text => {
    'worklet';
    return JSON.parse(text) as T;
  });
}
