import {
  init as initSentry,
  reactNativeTracingIntegration,
  appStartIntegration,
  graphqlIntegration,
  expoRouterIntegration,
  mobileReplayIntegration,
} from '@sentry/react-native';
import * as Sentry from '@sentry/react-native';
import { markSessionError } from '@app/utils/storeReview/sessionErrorFlag';
import type { ComponentType } from 'react';

/**
 * expoRouterIntegration auto-instruments Expo Router navigation, so no manual
 * registerNavigationContainer call is required — it is created here and passed
 * straight to Sentry.init's integrations below.
 */
export const navigationIntegration = expoRouterIntegration({
  enableTimeToInitialDisplay: true,
  enablePrefetchTracking: true,
  enableTimeToInitialDisplayForPreloadedRoutes: true,
});

let didInitializeSentry = false;

export interface SentryStatus {
  enabled: boolean;
  hasDsn: boolean;
  environment: string;
  release?: string;
  dist?: string;
  debug: boolean;
}

let sentryStatus: SentryStatus = {
  enabled: false,
  hasDsn: false,
  environment: process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development',
  debug: false,
};

export function getSentryStatus(): SentryStatus {
  return sentryStatus;
}

export function init() {
  if (didInitializeSentry) {
    return;
  }

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development';
  const hasDsn = Boolean(dsn);
  const enabled =
    hasDsn && (!__DEV__ || process.env.EXPO_PUBLIC_ENABLE_SENTRY === 'true');
  const debug = process.env.EXPO_PUBLIC_SENTRY_DEBUG === 'true';
  /**
   * Screenshots / view hierarchy can capture other users' chat messages and
   * logins, so keep them opt-in rather than attached to every event.
   */
  const captureUi = process.env.EXPO_PUBLIC_SENTRY_ATTACH_UI === 'true';

  sentryStatus = {
    enabled,
    hasDsn,
    environment: appVariant,
    release: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
    dist: process.env.EXPO_PUBLIC_SENTRY_DIST,
    debug,
  };

  // A release build with no DSN means Sentry silently captures nothing, which
  // is indistinguishable from "no errors" in the dashboard. Make it loud so it
  // shows up in device logs (Console.app / adb logcat) during triage.
  if (!hasDsn && !__DEV__) {
    console.error(
      '[sentry] EXPO_PUBLIC_SENTRY_DSN is missing from this build — error reporting is disabled.',
    );
  }

  initSentry({
    enabled,
    dsn,
    appHangTimeoutInterval: 1000,
    debug,
    environment: appVariant,
    dist: process.env.EXPO_PUBLIC_SENTRY_DIST,
    release: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
    enableAutoSessionTracking: true,
    enableLogs: true,
    enableCaptureFailedRequests: true,
    attachStacktrace: true,
    attachScreenshot: captureUi,
    attachViewHierarchy: captureUi,
    ignoreErrors: ['Network request failed'],
    sampleRate: 1,
    enableAutoPerformanceTracing: true,
    integrations: [
      navigationIntegration,
      reactNativeTracingIntegration(),
      appStartIntegration(),
      graphqlIntegration({ endpoints: ['https://7tv.io/v4/gql'] }),
      mobileReplayIntegration(),
    ],
    beforeSend(event) {
      // Keep the store-review prompt gate honest: any error-level event
      // (including unhandled rejections Sentry tracks itself) marks the
      // session so we never ask for a rating in a bad session.
      if (event.level === 'fatal' || event.level === 'error') {
        markSessionError();
      }
      return event;
    },
    tracesSampleRate: 1.0,
  });

  didInitializeSentry = true;
}

export function flushSentry(): Promise<boolean> {
  return Sentry.flush();
}

/**
 * Sends a message event and waits for the transport to flush. Lets a real
 * TestFlight build confirm the whole pipeline (init -> capture -> network)
 * works, rather than guessing from an empty dashboard.
 */
export async function verifySentryDelivery(): Promise<{
  eventId?: string;
  flushed: boolean;
}> {
  init();
  if (!sentryStatus.enabled || !sentryStatus.hasDsn) {
    return { flushed: false };
  }
  const eventId = Sentry.captureMessage(
    `Foam Sentry delivery check (${sentryStatus.environment})`,
    'info',
  );
  const flushed = await Sentry.flush();
  return { eventId, flushed };
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

export type FeedbackType = 'bug' | 'idea';

/**
 * Submit user feedback from the custom in-app feedback screen.
 * Tagged with the feedback type so bug reports and ideas can be triaged
 * separately in Sentry.
 */
export function sendFeedback(feedback: {
  type: FeedbackType;
  message: string;
  email?: string;
  name?: string;
}): void {
  init();
  Sentry.withScope(scope => {
    scope.setTag('feedback_type', feedback.type);
    Sentry.captureFeedback({
      message: feedback.message,
      email: feedback.email || undefined,
      name: feedback.name || undefined,
    });
  });
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

  Sentry.logger.warn(message, extra);
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

  Sentry.logger.info(message, extra);
}

/**
 * Forwards a log entry from the app logger (src/utils/logger.ts) into Sentry so
 * a single `logger.*` call reaches both the console and Sentry — callers no
 * longer need to also call recordError/recordWarning by hand. Only warn/error
 * are forwarded; debug/info stay local. No-ops when Sentry is disabled.
 */
export function forwardLogToSentry(entry: {
  level: 'warn' | 'error';
  category: string;
  message: string;
  error?: Error;
}): void {
  const { level, category, message, error } = entry;

  // A logging call must never throw and break the caller, so swallow any
  // failure from the Sentry pipeline (e.g. before init / in tests).
  try {
    if (level === 'error') {
      Sentry.withScope(scope => {
        scope.setTag('log_category', category);
        scope.setExtra('log_message', message);
        if (error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(message, 'error');
        }
      });
      return;
    }

    Sentry.addBreadcrumb({ category, message, level: 'warning' });
    Sentry.logger.warn(message, { category });
  } catch {
    // Intentionally ignored — never let logging crash app logic.
  }
}

export function countOtaMetric(
  name: OtaMetrics,
  attributes?: Record<string, string | number | boolean>,
  value = 1,
): void {
  countMetric(name, attributes, value);
}
