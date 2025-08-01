export type PersistNavigationConfig = 'always' | 'dev' | 'prod' | 'never';

export interface ConfigBaseProps {
  persistNavigation: PersistNavigationConfig;
  catchErrors: PersistNavigationConfig;
  exitRoutes: string[];
}

export const BaseConfig: ConfigBaseProps = {
  // This feature is particularly useful in development mode, but
  // can be used in production as well if you prefer.
  persistNavigation: __DEV__ ? 'always' : 'never',

  /**
   * Only enable if we're catching errors in the right environment
   */
  catchErrors: __DEV__ ? 'dev' : 'always',

  /**
   * This is a list of all the route names that will exit the app if the back button
   * is pressed while in that screen. Only affects Android.
   */
  exitRoutes: [],
};
