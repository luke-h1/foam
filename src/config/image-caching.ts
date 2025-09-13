import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Build constants
export const BUILD_TYPE: 'dev' | 'release' = Constants.expoConfig?.extra
  ?.buildType as 'dev' | 'release';

export const BUILD_ID_KEY = 'foam_build_id';

export const BUILD_ID = Constants.expoConfig?.extra?.buildId as string;

export const IS_WIDE_SCREEN = Platform.isTV || Platform.OS === 'web';
