import * as Sentry from '@sentry/react-native';

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

const appVariant =
  (process.env.APP_VARIANT as string | undefined) ?? 'development';
const isProductionVariant = appVariant === 'production';
const SAMPLE_RATE = isProductionVariant ? 0.2 : 0;
const REPLAYS_ON_ERROR_SAMPLE_RATE = 0;
const REPLAYS_SESSION_SAMPLE_RATE = 0;
const enableReplay =
  isProductionVariant &&
  (REPLAYS_ON_ERROR_SAMPLE_RATE > 0 || REPLAYS_SESSION_SAMPLE_RATE > 0);

const integrations: NonNullable<
  Parameters<typeof Sentry.init>[0]['integrations']
> = [navigationIntegration];

if (enableReplay) {
  integrations.push(Sentry.mobileReplayIntegration());
}

Sentry.init({
  dsn: 'https://c66140f9c8c6c72a91e15582f3086de5@o536134.ingest.us.sentry.io/4508831072780288',
  attachScreenshot: isProductionVariant,
  attachStacktrace: true,
  attachThreads: true,
  enableCaptureFailedRequests: true,
  spotlight: __DEV__,
  appHangTimeoutInterval: 1,
  enabled: true,
  profilesSampleRate: SAMPLE_RATE,
  tracesSampleRate: SAMPLE_RATE,
  replaysOnErrorSampleRate: REPLAYS_ON_ERROR_SAMPLE_RATE,
  replaysSessionSampleRate: REPLAYS_SESSION_SAMPLE_RATE,
  enableAutoPerformanceTracing: isProductionVariant,
  enableUserInteractionTracing: isProductionVariant,
  environment: appVariant,
  integrations,
});

type MetricAttributes = Record<string, string | number | boolean>;
type SentryMetrics = {
  count: (
    name: string,
    value: number,
    options?: { attributes?: MetricAttributes },
  ) => void;
};

export function countMetric(
  name: string,
  attributes?: MetricAttributes,
  value = 1,
): void {
  const metrics = (Sentry as typeof Sentry & { metrics?: SentryMetrics })
    .metrics;

  if (metrics) {
    metrics.count(name, value, {
      attributes,
    });
    return;
  }

  Sentry.addBreadcrumb({
    category: 'metric',
    level: 'info',
    message: name,
    data: {
      value,
      ...attributes,
    },
  });
}

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
