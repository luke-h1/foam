import '../polyfills/arrayByCopy';
import '../utils/performance/wdyr';
import 'expo-dev-client';
import '../i18n/i18next';

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { enableFreeze } from 'react-native-screens';

import * as WebBrowser from 'expo-web-browser';

import { installGlobalErrorHandlers } from '../lib/global-error-handlers';
import { init as initSentry } from '../lib/sentry';
import { sweepOversizedSentryEnvelopes } from '../lib/sentryCacheSweep';

configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

enableFreeze(true);

WebBrowser.maybeCompleteAuthSession();
sweepOversizedSentryEnvelopes();
initSentry();
installGlobalErrorHandlers();

export { default } from './defaultRootLayout';
