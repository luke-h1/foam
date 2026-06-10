import {
  init as initSentry,
  reactNativeTracingIntegration,
  reactNavigationIntegration,
} from '@sentry/react-native';
import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';

// Created once at module load so RootLayoutNav can call
// navigationIntegration.registerNavigationContainer(ref) before the first
// navigation event fires.
export const navigationIntegration = reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

let didInitializeSentry = false;

export function init() {
  if (didInitializeSentry) {
    return;
  }

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development';

  initSentry({
    enabled:
      Boolean(dsn) &&
      (!__DEV__ || process.env.EXPO_PUBLIC_ENABLE_SENTRY === 'true'),
    dsn,
    appHangTimeoutInterval: 1000,
    debug: false,
    environment: appVariant,
    dist: process.env.EXPO_PUBLIC_SENTRY_DIST,
    release: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
    enableAutoSessionTracking: true,
    ignoreErrors: ['Network request failed'],
    attachStacktrace: true,
    sampleRate: 1,
    integrations: [reactNativeTracingIntegration(), navigationIntegration],
    // 100% in dev/testflight for full visibility; 20% in production to keep
    // transaction volume manageable on high-chat-volume sessions.
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
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

export function countMetric(
  name: string,
  attributes?: Record<string, string | number | boolean>,
  value = 1,
): void {
  Sentry.metrics.count(name, value, {
    attributes,
  });
}

export async function startSpanAsync<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  return Sentry.startSpan({ name, op, attributes }, fn);
}

type MonitoringEventPrefix =
  | 'api'
  | 'auth'
  | 'bttv_api'
  | 'bttv_emotes'
  | 'bttv_provider'
  | 'bttv_ws'
  | 'chat_resources'
  | 'chatterino_badges'
  | 'data_loading'
  | 'error_boundary'
  | 'fatal'
  | 'ffz_api'
  | 'ffz_badges'
  | 'ffz_emotes'
  | 'ffz_provider'
  | 'handled'
  | 'network'
  | 'ota_updates_service'
  | 'seven_tv_api'
  | 'seven_tv_badges'
  | 'seven_tv_cosmetics'
  | 'seven_tv_emotes'
  | 'seven_tv_presence'
  | 'seven_tv_provider'
  | 'seven_tv_ws'
  | 'stream'
  | 'twitch_api'
  | 'twitch_badges'
  | 'twitch_chat'
  | 'twitch_emotes'
  | 'twitch_player'
  | 'twitch_polls'
  | 'twitch_predictions'
  | 'twitch_provider'
  | 'twitch_sign_in'
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

function buildMetadata(
  name: string,
  params?: Record<string, unknown>,
  cause?: unknown,
): Record<string, unknown> {
  return {
    ...params,
    name,
    cause: cause instanceof Error ? cause.toString() : cause,
  };
}

export function recordError(error: {
  name: MonitoringErrorName;
  exceptionName?: string;
  message: string;
  params?: Record<string, unknown>;
  errorCause?: unknown;
  tags?: Record<string, string>;
  fingerprint?: string[];
}): void {
  Sentry.addBreadcrumb({
    message: `${error.exceptionName ?? error.name}: ${error.message}`,
    level: 'error',
  });

  Sentry.withScope(scope => {
    scope.setTag('error_type', error.name);

    if (error.tags) {
      for (const [k, v] of Object.entries(error.tags)) {
        scope.setTag(k, v);
      }
    }

    if (error.fingerprint) {
      scope.setFingerprint(error.fingerprint);
    }

    if (error.params) {
      scope.setContext('error_params', error.params);
    }

    const exceptionToCapture = new Error(error.message, {
      cause: error.errorCause,
    });
    exceptionToCapture.name = error.exceptionName ?? error.name;

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
  const extra = buildMetadata(
    warning.name,
    warning.params,
    warning.warningCause,
  );

  Sentry.addBreadcrumb({
    message,
    level: 'warning',
    data: extra,
  });

  Sentry.captureMessage(message, {
    level: 'warning',
    extra,
  });
}

export function recordInfo(info: {
  name: MonitoringInfoName;
  message: string;
  params?: Record<string, unknown>;
  infoCause?: unknown;
}): void {
  const message = `${info.name}: ${info.message}`;
  const extra = buildMetadata(info.name, info.params, info.infoCause);

  Sentry.addBreadcrumb({
    message,
    level: 'info',
    data: extra,
  });
}

export function countOtaMetric(
  name: OtaMetrics,
  attributes?: Record<string, string | number | boolean>,
  value = 1,
): void {
  countMetric(name, attributes, value);
}
