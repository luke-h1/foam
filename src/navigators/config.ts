export type PersistNavigationConfig = 'always' | 'dev' | 'prod' | 'never';

export interface ConfigBaseProps {
  catchErrors: PersistNavigationConfig;
}

export const BaseConfig: ConfigBaseProps = {
  catchErrors: __DEV__ ? 'dev' : 'always',
};
