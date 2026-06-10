import '../utils/performance/wdyr';

import { Observe } from 'expo-observe';
import 'expo-dev-client';
import * as WebBrowser from 'expo-web-browser';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { enableFreeze } from 'react-native-screens';
import { installGlobalErrorHandlers } from '../lib/global-error-handlers';
import { init as initSentry } from '../lib/sentry';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

enableFreeze(true);

WebBrowser.maybeCompleteAuthSession();
initSentry();
installGlobalErrorHandlers();
Observe.configure({
  environment: process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development',
  dispatchingEnabled: true,
});

export { default } from './defaultRootLayout';
