import { registerRootComponent } from 'expo';
import App from './App';
import 'expo-dev-client';

// eslint-disable-next-line no-undef
// if (!__DEV__) {
//   const {
//     EXPO_PUBLIC_NEW_RELIC_IOS_APP_TOKEN,
//     EXPO_PUBLIC_NEW_RELIC_ANDROID_APP_TOKEN,
//   } = process.env;

//   const appToken =
//     Platform.OS === 'ios'
//       ? EXPO_PUBLIC_NEW_RELIC_IOS_APP_TOKEN
//       : EXPO_PUBLIC_NEW_RELIC_ANDROID_APP_TOKEN;

//   const agentConfiguration = {
//     analyticsEventEnabled: true,
//     crashReportingEnabled: true,
//     interactionTracingEnabled: true,
//     networkRequestEnabled: true,
//     networkErrorRequestEnabled: true,
//     httpRequestBodyCaptureEnabled: true,
//     loggingEnabled: true,
//     logLevel: NewRelic.LogLevel.INFO,
//     webViewInstrumentation: true,
//   };

//   agentConfiguration.loggingEnabled = true;
//   agentConfiguration.logLevel = NewRelic.LogLevel.VERBOSE;

//   NewRelic.startAgent(appToken, agentConfiguration);
//   NewRelic.setJSAppVersion(version);
// }

registerRootComponent(App);
