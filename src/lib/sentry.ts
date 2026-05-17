import { OpenStringUnion } from '@app/utils/typescript/OpenStringUnion';

const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development';

type BreadcrumbLevel = 'info' | 'warning' | 'error';
type MetricAttributes = Record<string, string | number | boolean>;
type SdkBreadcrumb = {
  category?: string;
  level?: BreadcrumbLevel;
  message?: string;
  data?: Record<string, unknown>;
};
type SentryMetrics = {
  count: (
    name: string,
    value: number,
    options?: { attributes?: MetricAttributes },
  ) => void;
};
type SentryLogger = {
  warn: (...args: readonly unknown[]) => void;
  info: (...args: readonly unknown[]) => void;
  error: (...args: readonly unknown[]) => void;
};
type SentryScope = {
  setTag: (key: string, value: string) => void;
  setContext: (key: string, value: Record<string, unknown>) => void;
};

type SentryRecordLike = {
  addBreadcrumb: (breadcrumb: SdkBreadcrumb) => void;
  withScope: (cb: (scope: SentryScope) => void) => void;
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, context?: Record<string, unknown>) => void;
  showFeedbackWidget: () => void;
  logger: SentryLogger;
  startSpan: <T>(
    options: { name: string; op: string; attributes?: Record<string, unknown> },
    fn: () => T,
  ) => T;
  metrics?: SentryMetrics;
};

function stringifyForLog(value: unknown) {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}

function log(level: 'info' | 'warn' | 'error', message: string) {
  if (level === 'warn') {
    console.warn(`[metrics] ${message}`);
  } else if (level === 'error') {
    console.error(`[metrics] ${message}`);
  } else {
    console.log(`[metrics] ${message}`);
  }
}

function withScopeLog(prefix: string, value: string) {
  log('info', `${prefix}: ${value}`);
}

function createBreadcrumbMessage({
  category,
  message,
  level,
  data,
}: SdkBreadcrumb) {
  const scope = category ? `[${category}]` : '[app]';
  const levelLabel = level ?? 'info';
  const suffix = data ? ` ${stringifyForLog(data)}` : '';
  return `${scope} ${levelLabel} ${message ?? ''}${suffix}`.trim();
}

export const sentryService: SentryRecordLike = {
  addBreadcrumb: breadcrumb => {
    const mappedLevel =
      breadcrumb.level === 'warning' ? 'warn' : breadcrumb.level;
    log(mappedLevel ?? 'info', createBreadcrumbMessage(breadcrumb));
  },
  withScope: cb => {
    const scope: SentryScope = {
      setTag(key, value) {
        withScopeLog('tag', `${key}=${value}`);
      },
      setContext(key, contextValue) {
        withScopeLog('context', `${key}=${stringifyForLog(contextValue)}`);
      },
    };
    cb(scope);
  },
  captureException: error => {
    log('error', `captured-exception: ${stringifyForLog(error)}`);
  },
  captureMessage: (message, context) => {
    const contextText = context ? ` ${stringifyForLog(context)}` : '';
    log('info', `message: ${message}${contextText}`);
  },
  showFeedbackWidget: () => {
    log('warn', 'feedback widget disabled; metrics moved to logs');
  },
  logger: {
    warn: (...args) => console.warn('[warn]', ...args),
    info: (...args) => console.log('[info]', ...args),
    error: (...args) => console.error('[error]', ...args),
  },
  startSpan: ({ name, op, attributes }, fn) => {
    const attrs = attributes ? ` ${stringifyForLog(attributes)}` : '';
    log('info', `span start: ${name} (${op})${attrs}`);
    return fn();
  },
  metrics: {
    count: (name, value, options) => {
      const attrs = options?.attributes
        ? stringifyForLog(options.attributes)
        : '{}';
      log('info', `metric: ${name}=${value} attrs=${attrs}`);
    },
  },
};

export function init() {
  log('info', `sentry disabled in ${appVariant}; using generic logs`);
}

export function countMetric(
  name: string,
  attributes?: MetricAttributes,
  value = 1,
): void {
  sentryService.metrics?.count(name, value, {
    attributes,
  });
}

export function startSpan<T>(
  name: string,
  op: string,
  fn: () => T,
  attributes?: Record<string, string | number | boolean>,
): T {
  return sentryService.startSpan({ name, op, attributes }, fn);
}

export async function startSpanAsync<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  return sentryService.startSpan({ name, op, attributes }, fn);
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

type MonitoringCategory =
  | 'Auth'
  | 'API'
  | 'DataLoading'
  | 'ErrorBoundary'
  | 'OTAUpdatesService'
  | 'Stream'
  | 'Unknown';

type MonitoringErrorCategory = OpenStringUnion<
  MonitoringCategory | 'General' | 'Network'
>;
type MonitoringWarningCategory = OpenStringUnion<
  MonitoringCategory | 'General' | 'Network'
>;
type MonitoringInfoCategory = OpenStringUnion<
  MonitoringCategory | 'General' | 'Network'
>;

export type MonitoringErrorName = `${MonitoringErrorCategory}Error`;
export type MonitoringWarningName = `${MonitoringWarningCategory}Warning`;
export type MonitoringInfoName = `${MonitoringInfoCategory}Info`;

export type OtaMetrics = OpenStringUnion<
  | 'ota.check.started'
  | 'ota.update.available'
  | 'ota.update.fetched'
  | 'ota.update.pending'
  | 'ota.update.alert_shown'
  | 'ota.update.applied'
>;

function isErrorLike(value: unknown): value is Error {
  return (
    value instanceof Error ||
    (typeof value === 'object' &&
      value !== null &&
      typeof (value as { name?: unknown; message?: unknown }).name ===
        'string' &&
      typeof (value as { message?: unknown }).message === 'string')
  );
}

function serializeCause(cause: unknown) {
  if (!cause) {
    return {};
  }

  if (isErrorLike(cause)) {
    return {
      cause_name: cause.name,
      cause_message: cause.message,
      cause_stack: cause.stack,
    };
  }

  return {
    cause_raw: cause,
    cause_stringified: stringifyForLog(cause),
  };
}

function buildRecordAttributes({
  name,
  params,
  cause,
}: {
  name: string;
  params?: Record<string, unknown>;
  cause?: unknown;
}) {
  return {
    record_name: name,
    ...params,
    ...serializeCause(cause),
  };
}

export function recordError(error: {
  name: MonitoringErrorName;
  message: string;
  params?: Record<string, unknown>;
  errorCause?: unknown;
}) {
  sentryService.addBreadcrumb({
    message: `${error.name}: ${error.message}`,
    level: 'error',
  });

  sentryService.withScope(scope => {
    scope.setTag('errorType', error.name);

    if (error.params) {
      scope.setContext('errorParams', error.params);
    }

    const exceptionToCapture = new Error(error.message);
    exceptionToCapture.name = error.name;

    if (error.errorCause) {
      if (isErrorLike(error.errorCause)) {
        (exceptionToCapture as Error & { cause: unknown }).cause =
          error.errorCause;
      } else {
        scope.setContext('errorCause', serializeCause(error.errorCause));
      }
    }

    sentryService.captureException(exceptionToCapture);
  });
}

export function recordWarning(warning: {
  name: MonitoringWarningName;
  message: string;
  params?: Record<string, unknown>;
  warningCause?: unknown;
}) {
  sentryService.addBreadcrumb({
    message: `${warning.name}: ${warning.message}`,
    level: 'warning',
  });

  sentryService.logger.warn(
    `${warning.name}: ${warning.message}`,
    buildRecordAttributes({
      name: warning.name,
      params: warning.params,
      cause: warning.warningCause,
    }),
  );
}

export function recordInfo(info: {
  name: MonitoringInfoName;
  message: string;
  params?: Record<string, unknown>;
  infoCause?: unknown;
}) {
  sentryService.addBreadcrumb({
    message: `${info.name}: ${info.message}`,
    level: 'info',
  });

  sentryService.logger.info(
    `${info.name}: ${info.message}`,
    buildRecordAttributes({
      name: info.name,
      params: info.params,
      cause: info.infoCause,
    }),
  );
}

export function countMonitoringMetric(
  name: OtaMetrics,
  attributes?: Record<string, string | number | boolean>,
  value = 1,
) {
  return countMetric(name, attributes, value);
}

export const navigationIntegration = {
  id: 'navigation',
  setupOnce() {
    return;
  },
};
