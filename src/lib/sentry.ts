import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';

let didInitializeSentry = false;
let sentrySendTimeout: ReturnType<typeof setTimeout> | null = null;

const queuedSentryMessages: {
  context?: Record<string, unknown>;
  message: string;
  tags?: Record<string, string>;
}[] = [];

export function init(): void {
  if (didInitializeSentry) {
    return;
  }

  const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development';

  Sentry.init({
    enabled: appVariant !== 'development',
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    debug: false,
    environment: appVariant,
    release: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
    dist: process.env.EXPO_PUBLIC_SENTRY_DIST,
    enableAutoSessionTracking: false,
    enableMetrics: true,
    ignoreErrors: ['Network request failed'],
    attachStacktrace: false,
    sampleRate: appVariant === 'production' ? 0.1 : 1,
  });

  didInitializeSentry = true;
}

export function wrapWithSentry<P extends Record<string, unknown>>(
  RootComponent: ComponentType<P>,
) {
  return Sentry.wrap(RootComponent);
}

export function showFeedbackWidget(): void {
  init();
  Sentry.showFeedbackWidget();
}

export const FeedbackWidget = Sentry.FeedbackWidget;

export function countMetric(
  name: string,
  attributes?: Record<string, string | number | boolean>,
  value = 1,
): void {
  Sentry.metrics.count(name, value, {
    attributes,
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

type MonitoringEventPrefix =
  | 'api'
  | 'auth'
  | 'bttv_emotes'
  | 'bttv_provider'
  | 'bttv_ws'
  | 'chat_resources'
  | 'chatterino_badges'
  | 'data_loading'
  | 'error_boundary'
  | 'fatal'
  | 'ffz_badges'
  | 'ffz_emotes'
  | 'ffz_provider'
  | 'handled'
  | 'network'
  | 'ota_updates_service'
  | 'seven_tv_badges'
  | 'seven_tv_cosmetics'
  | 'seven_tv_emotes'
  | 'seven_tv_presence'
  | 'seven_tv_provider'
  | 'seven_tv_ws'
  | 'stream'
  | 'twitch_badges'
  | 'twitch_chat'
  | 'twitch_emotes'
  | 'twitch_player'
  | 'twitch_polls'
  | 'twitch_predictions'
  | 'twitch_provider'
  | 'twitch_ws'
  | 'unknown';

export type MonitoringErrorName = `${MonitoringEventPrefix}_error`;
export type MonitoringWarningName = `${MonitoringEventPrefix}_warning`;
export type MonitoringInfoName = `${MonitoringEventPrefix}_info`;

export type OtaMetrics =
  | 'ota.check.started'
  | 'ota.update.available'
  | 'ota.update.fetched'
  | 'ota.update.pending'
  | 'ota.update.alert_shown'
  | 'ota.update.applied';

function serializeCause(cause: unknown): Record<string, unknown> {
  if (!cause) {
    return {};
  }

  if (cause instanceof Error) {
    return {
      cause_name: cause.name,
      cause_message: cause.message,
      cause_stack: cause.stack,
    };
  }

  return {
    cause_raw: cause,
    cause_stringified: serializeUnknownCause(cause),
  };
}

function serializeUnknownCause(cause: unknown): string {
  if (typeof cause === 'string') {
    return cause;
  }

  if (typeof cause === 'number' || typeof cause === 'boolean') {
    return `${cause}`;
  }

  if (typeof cause === 'bigint') {
    return cause.toString();
  }

  if (typeof cause === 'symbol') {
    return cause.description ?? 'symbol';
  }

  if (typeof cause === 'function') {
    return cause.name || 'function';
  }

  try {
    return JSON.stringify(cause) ?? '[unserializable]';
  } catch {
    return '[unserializable]';
  }
}

function buildRecordAttributes({
  name,
  params,
  cause,
}: {
  name: string;
  params?: Record<string, unknown>;
  cause?: unknown;
}): Record<string, unknown> {
  return {
    record_name: name,
    ...params,
    ...serializeCause(cause),
  };
}

function queueMessageForSentry({
  context,
  message,
  tags,
}: {
  context?: Record<string, unknown>;
  message: string;
  tags?: Record<string, string>;
}): void {
  queuedSentryMessages.push({
    context,
    message,
    tags,
  });

  if (sentrySendTimeout) {
    return;
  }

  sentrySendTimeout = setTimeout(() => {
    sentrySendTimeout = null;
    sendQueuedMessages();
  }, 7000);
}

function sendQueuedMessages(): void {
  while (queuedSentryMessages.length > 0) {
    const record = queuedSentryMessages.shift();

    if (!record) {
      continue;
    }

    Sentry.captureMessage(record.message, {
      level: 'warning',
      tags: record.tags,
      extra: record.context,
    });
  }
}

export function recordError(error: {
  name: MonitoringErrorName;
  message: string;
  params?: Record<string, unknown>;
  errorCause?: unknown;
}): void {
  Sentry.addBreadcrumb({
    message: `${error.name}: ${error.message}`,
    level: 'error',
  });

  Sentry.withScope(scope => {
    scope.setTag('error_type', error.name);

    if (error.params) {
      scope.setContext('error_params', error.params);
    }

    const exceptionToCapture = new Error(error.message, {
      cause: error.errorCause,
    });
    exceptionToCapture.name = error.name;

    Sentry.captureException(exceptionToCapture);
  });
}

export function recordWarning(warning: {
  name: MonitoringWarningName;
  message: string;
  params?: Record<string, unknown>;
  warningCause?: unknown;
}): void {
  const message = `${warning.name}: ${warning.message}`;
  const context = buildRecordAttributes({
    name: warning.name,
    params: warning.params,
    cause: warning.warningCause,
  });

  Sentry.addBreadcrumb({
    message,
    level: 'warning',
    data: context,
  });

  queueMessageForSentry({
    message,
    tags: {
      category: warning.name,
    },
    context,
  });
}

export function recordInfo(info: {
  name: MonitoringInfoName;
  message: string;
  params?: Record<string, unknown>;
  infoCause?: unknown;
}): void {
  Sentry.addBreadcrumb({
    message: `${info.name}: ${info.message}`,
    level: 'info',
    data: buildRecordAttributes({
      name: info.name,
      params: info.params,
      cause: info.infoCause,
    }),
  });
}

export function countOtaMetric(
  name: OtaMetrics,
  attributes?: Record<string, string | number | boolean>,
  value = 1,
): void {
  countMetric(name, attributes, value);
}

export const navigationIntegration = {
  id: 'navigation',
  setupOnce(): void {
    return;
  },
};
