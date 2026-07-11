import {
  createWorkletRuntime,
  type WorkletRuntime,
} from 'react-native-worklets';

import { logger } from '@app/utils/logger';

let parseRuntime: WorkletRuntime | null | undefined;

export function getParseRuntime(): WorkletRuntime | null {
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
