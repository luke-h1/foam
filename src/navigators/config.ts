export type PersistNavigationConfig = 'always' | 'dev' | 'prod' | 'never';

export interface ConfigBaseProps {
  persistNavigation: PersistNavigationConfig;
  catchErrors: PersistNavigationConfig;
  exitRoutes: string[];
}

export const BaseConfig: ConfigBaseProps = {
  persistNavigation: __DEV__ ? 'always' : 'never',

  catchErrors: __DEV__ ? 'dev' : 'always',

  exitRoutes: [],
};
