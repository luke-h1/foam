import { registerRootComponent } from 'expo';
import 'expo-dev-client';
import newRelic from 'newrelic-react-native-agent';
import { Platform } from 'react-native';
import { version } from './package.json';
import App from './src/App';

// eslint-disable-next-line no-undef
const IOS_TOKEN = process.env.NEW_RELIC_IOS_APP_TOKEN;
const ANDROID_TOKEN = process.env.NEW_RELIC_ANDROID_APP_TOKEN;

const appToken = Platform.OS === 'ios' ? IOS_TOKEN : ANDROID_TOKEN;

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
  logLevel: newRelic.LogLevel.INFO,
  // iOS Specific
  // Optional:Enable/Disable automatic instrumentation of WebViews
  webViewInstrumentation: true,
};

agentConfiguration.loggingEnabled = true;
agentConfiguration.logLevel = newRelic.LogLevel.VERBOSE;

newRelic.startAgent(appToken, agentConfiguration);
newRelic.setJSAppVersion(version);

registerRootComponent(App);
