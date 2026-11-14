import { logger } from '@app/utils/logger';
import { markSessionError } from '@app/utils/store-review/sessionErrorFlag';

import { flushSentry } from './sentry';

type FatalErrorListener = (error: Error) => void;

let fatalErrorListener: FatalErrorListener | null = null;
let didInstall = false;

export function setFatalErrorListener(
  listener: FatalErrorListener | null,
): void {
  fatalErrorListener = listener;
}

/**
 * Must run after Sentry init so the chained previous handler is Sentry's;
 * unhandled rejections stay with Sentry's integration to avoid double-reports.
 */
export function installGlobalErrorHandlers(): void {
  // ErrorUtils only exists in the React Native runtime; on web Sentry's
  // browser global handlers cover this.
  if (didInstall || !('ErrorUtils' in globalThis)) {
    return;
  }

  didInstall = true;

  const previousHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    markSessionError();

    if (!__DEV__ && isFatal && fatalErrorListener) {
      const fatalError =
        error instanceof Error ? error : new Error(String(error));

      logger.main.error(fatalError.message, {
        name: 'fatal_error',
        exceptionName: fatalError.name,
        error: fatalError,
        handledBy: 'global_error_handler',
      });

      void flushSentry();

      fatalErrorListener(fatalError);
      return;
    }

    previousHandler(error, isFatal);
  });
}
