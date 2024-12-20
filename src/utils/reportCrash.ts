/* eslint-disable no-console */
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
    const message = error.message || 'unknown';
    console.error(error);
    console.log(message, type);
  } else {
    // TODO: log to new relic here
  }
};
