/* eslint-disable */
import { registerRootComponent } from 'expo';
import NewRelic from 'newrelic-react-native-agent';
import { Platform } from 'react-native';
import App from './App';
import 'expo-dev-client';
import { version } from './package.json' assert { type: 'json' };
import './src/polyfills';

// eslint-disable-next-line no-undef
if (!__DEV__) {
  const {
    EXPO_PUBLIC_NEW_RELIC_IOS_APP_TOKEN,
    EXPO_PUBLIC_NEW_RELIC_ANDROID_APP_TOKEN,
  } = process.env;

  const appToken =
    Platform.OS === 'ios'
      ? EXPO_PUBLIC_NEW_RELIC_IOS_APP_TOKEN
      : EXPO_PUBLIC_NEW_RELIC_ANDROID_APP_TOKEN;

  const agentConfiguration = {
    // Android Specific
    // Optional:Enable or disable collection of event data.
    analyticsEventEnabled: true,
    // Optional:Enable or disable crash reporting.
    crashReportingEnabled: true,
    // Optional:Enable or disable interaction tracing. Trace instrumentation still occurs, but no traces are harvested. This will disable default and custom interactions.
    interactionTracingEnabled: true,
    // Optional:Enable or disable reporting successful HTTP requests to the MobileRequest event type.
    networkRequestEnabled: true,
    // Optional:Enable or disable reporting network and HTTP request errors to the MobileRequestError event type.
    networkErrorRequestEnabled: true,
    // Optional:Enable or disable capture of HTTP response bodies for HTTP error traces, and MobileRequestError events.
    httpRequestBodyCaptureEnabled: true,
    // Optional:Enable or disable agent logging.
    loggingEnabled: true,
    // Optional:Specifies the log level. Omit this field for the default log level.
    // Options include: ERROR (least verbose), WARNING, INFO, VERBOSE, AUDIT (most verbose).
    logLevel: NewRelic.LogLevel.INFO,
    // iOS Specificl
    // Optional:Enable/Disable automatic instrumentation of WebViews
    webViewInstrumentation: true,
  };

  agentConfiguration.loggingEnabled = true;
  agentConfiguration.logLevel = NewRelic.LogLevel.VERBOSE;

  NewRelic.startAgent(appToken, agentConfiguration);
  NewRelic.setJSAppVersion(version);
}

registerRootComponent(App);
