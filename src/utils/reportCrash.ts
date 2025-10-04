import { sentryService } from '@app/services';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const reportCrash = (error: any, type = ErrorType.FATAL) => {
  if (__DEV__ || process.env.NODE_ENV === 'development') {
    const message = error instanceof Error ? error.message : 'Unknown';
    console.error(error);
    console.log(message, type);
  } else {
    sentryService.captureException(error);
  }
};
