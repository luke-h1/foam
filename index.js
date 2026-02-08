import NewRelic from 'newrelic-react-native-agent';
import { Platform } from 'react-native';
import * as appVersion from './package.json';

const appToken = Platform.select({
  ios: process.env.NEW_RELIC_IOS_TOKEN,
  android: process.env.NEW_RELIC_ANDROID_TOKEN,
});

if (appToken) {
  NewRelic.startAgent(appToken, {
    analyticsEventEnabled: true,
    nativeCrashReportingEnabled: true,
    crashReportingEnabled: true,
    interactionTracingEnabled: true,
    networkRequestEnabled: true,
    networkErrorRequestEnabled: true,
    httpResponseBodyCaptureEnabled: true,
    loggingEnabled: true,
    logLevel: NewRelic.LogLevel.INFO,
    webViewInstrumentation: true,
    offlineStorageEnabled: true,
    distributedTracingEnabled: true,
    backgroundReportingEnabled: false,
  });
  NewRelic.setJSAppVersion(appVersion.version);
}

import { registerRootComponent } from 'expo';
import 'expo-dev-client';
import App from './src/App';

registerRootComponent(App);
