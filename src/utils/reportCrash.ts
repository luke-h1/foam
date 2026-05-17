import { sentryService } from '@app/lib/sentry';

export enum ErrorType {
  /**
   * An error that would normally cause a red screen in dev
   * and force the user to sign out and restart.
   */
  FATAL = 'Fatal',
  /**
   * An error caught by try/catch where defined
   */
  HANDLED = 'Handled',
}

export const reportCrash = (error: unknown, type = ErrorType.FATAL) => {
  if (__DEV__ || process.env.NODE_ENV === 'development') {
    const message = error instanceof Error ? error.message : 'Unknown';
    console.error(error);
    console.log(message, type);
  } else {
    sentryService.captureException(error);
  }
};
