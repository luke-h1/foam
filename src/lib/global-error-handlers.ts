import { markSessionError } from '@app/utils/storeReview/sessionErrorFlag';
import { recordError } from './sentry';

type FatalErrorListener = (error: Error) => void;

let fatalErrorListener: FatalErrorListener | null = null;
let didInstall = false;

/**
 * Registered by GlobalErrorGate so a production fatal renders the
 * ErrorDetails recovery screen instead of killing the app.
 */
export function setFatalErrorListener(
  listener: FatalErrorListener | null,
): void {
  fatalErrorListener = listener;
}

/**
 * Must run after Sentry init so the previous handler being chained is
 * Sentry's (which captures the exception before deferring to RN's
 * default handler).
 *
 * Unhandled promise rejections are not handled here: Sentry's default
 * reactNativeErrorHandlersIntegration already patches the global
 * promise and reports them; installing a second tracker would
 * double-report.
 */
export function installGlobalErrorHandlers(): void {
  // ErrorUtils only exists in the React Native runtime; on web Sentry's
  // browser global handlers cover this.
  if (didInstall || typeof ErrorUtils === 'undefined') {
    return;
  }
  didInstall = true;

  const previousHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    markSessionError();

    // In production a fatal would otherwise crash the app after Sentry
    // reports it (its handler defers to RN's default). Capture it
    // ourselves and route to the recovery UI instead. Dev keeps the
    // redbox; with no listener mounted yet, fall through to the chain.
    if (!__DEV__ && isFatal && fatalErrorListener) {
      const fatalError =
        error instanceof Error ? error : new Error(String(error));

      recordError({
        name: 'fatal_error',
        exceptionName: fatalError.name,
        message: fatalError.message,
        params: { handledBy: 'global_error_handler' },
        errorCause: fatalError,
      });

      fatalErrorListener(fatalError);
      return;
    }

    previousHandler(error, isFatal);
  });
}
