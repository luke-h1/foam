import * as Sentry from '@sentry/react-native';

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

const SAMPLE_RATE = __DEV__ ? 1.0 : 0.2;

Sentry.init({
  dsn: 'https://c66140f9c8c6c72a91e15582f3086de5@o536134.ingest.us.sentry.io/4508831072780288',
  attachScreenshot: true,
  attachStacktrace: true,
  attachThreads: true,
  enableCaptureFailedRequests: true,
  spotlight: __DEV__,
  appHangTimeoutInterval: 1,
  enabled: true,
  profilesSampleRate: SAMPLE_RATE,
  tracesSampleRate: SAMPLE_RATE,
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
  enableAutoPerformanceTracing: true,
  enableUserInteractionTracing: true,
  environment: process.env.APP_VARIANT as string,
  integrations: [navigationIntegration, Sentry.mobileReplayIntegration()],
});

export function startSpan<T>(
  name: string,
  op: string,
  fn: () => T,
  attributes?: Record<string, string | number | boolean>,
): T {
  return Sentry.startSpan({ name, op, attributes }, fn);
}

export async function startSpanAsync<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  return Sentry.startSpan({ name, op, attributes }, fn);
}

export function measurePerformance<T>(
  operation: string,
  fn: () => T,
  attributes?: Record<string, string | number | boolean>,
): T {
  return startSpan(operation, 'function', fn, attributes);
}

export async function measurePerformanceAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  return startSpanAsync(operation, 'function', fn, attributes);
}

export { Sentry as sentryService, navigationIntegration };
