import * as Sentry from '@sentry/react-native';

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

/**
 * Adjust once we have users
 */
const sampleRate = 1;

Sentry.init({
  dsn: 'https://c66140f9c8c6c72a91e15582f3086de5@o536134.ingest.us.sentry.io/4508831072780288',
  attachScreenshot: true,
  attachStacktrace: true,
  attachThreads: true,
  enableCaptureFailedRequests: true,
  spotlight: __DEV__,
  appHangTimeoutInterval: 1,
  enabled: !__DEV__,
  profilesSampleRate: sampleRate,
  tracesSampleRate: sampleRate,

  /**
   * Replays are expensive, let's disable them
   */
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,

  enableAutoPerformanceTracing: true,
  enableUserInteractionTracing: true,
  environment: process.env.APP_VARIANT as string,
  integrations: [navigationIntegration, Sentry.mobileReplayIntegration()],
});

export { Sentry as sentryService, navigationIntegration };
