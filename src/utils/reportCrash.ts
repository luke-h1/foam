import { recordError } from '@app/lib/sentry';

export enum ErrorType {
  /**
   * An error that would normally cause a red screen in dev
   * and force the user to sign out and restart.
   */
  FATAL = 'fatal',
  /**
   * An error caught by try/catch where defined
   */
  HANDLED = 'handled',
}

export const reportCrash = (error: unknown, type = ErrorType.FATAL) => {
  const message = error instanceof Error ? error.message : 'Unknown';

  if (__DEV__ || process.env.NODE_ENV === 'development') {
    console.error(error);
    console.log(message, type);
  } else {
    recordError({
      name: `${type}_error`,
      message,
      params: {
        type,
      },
      errorCause: error,
    });
  }
};
