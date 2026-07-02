import type { ComponentType } from 'react';

import * as Sentry from '@sentry/react-native';
import {
  appStartIntegration,
  expoRouterIntegration,
  graphqlIntegration,
  init as initSentry,
  mobileReplayIntegration,
  reactNativeTracingIntegration,
  wrapExpoImage,
} from '@sentry/react-native';
import { Image as ExpoImage } from 'expo-image';

import { sanitiseLogValue } from '@app/utils/log/sanitiseLogValue';
import { markSessionError } from '@app/utils/storeReview/sessionErrorFlag';
import type { OpenStringUnion } from '@app/utils/typescript/OpenStringUnion';

/**
 * expoRouterIntegration auto-instruments Expo Router navigation, so no manual
 * registerNavigationContainer call is required — it is created here and passed
 * straight to Sentry.init's integrations below.
 */
export const navigationIntegration = expoRouterIntegration({
  enableTimeToInitialDisplay: true,
  enablePrefetchTracking: true,
  enableTimeToInitialDisplayForPreloadedRoutes: true,
  useDispatchedActionData: true,
});

let didInitializeSentry = false;

/**
 * Strip personally-identifying fields before an event leaves the device: the
 * IP address (which Sentry geolocates server-side), account identifiers that
 * may have reached the scope, device names like "Luke's iPhone" that embed a
 * person's name, and the host name. User-submitted feedback carries its email
 * on the feedback context, not event.user, so it is unaffected.
 */
function scrubPii<T extends Sentry.ErrorEvent | Sentry.TransactionEvent>(
  event: T,
): T {
  if (event.user) {
    event.user.ip_address = undefined;
    delete event.user.email;
    delete event.user.username;
    delete event.user.name;
    delete event.user.geo;
  }
  if (event.contexts?.device) {
    delete event.contexts.device.name;
  }
  delete event.server_name;
  return event;
}

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
  const isProduction = appVariant === 'production';

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
    sendDefaultPii: false,
    enableLogs: true,
    enableCaptureFailedRequests: true,
    attachStacktrace: true,
    attachScreenshot: true,
    attachViewHierarchy: true,
    screenshot: {
      maskAllText: true,
      maskAllImages: true,
    },
    ignoreErrors: ['Network request failed'],
    sampleRate: 1.0,
    /**
     * Session replay records and encodes screenshots continuously and 100%
     * tracing keeps span bookkeeping on every interaction; together they showed
     * up in production JS-thread profiles as the base64/envelope encoders
     * (~580s cumulative over 14 days). Production keeps errors at 100% but
     * samples the always-on instruments down; internal/testflight/preview stay
     * at 100% for full visibility. profilesSampleRate is relative to
     * tracesSampleRate, so profiles still cover every sampled trace.
     */
    tracesSampleRate: isProduction ? 0.15 : 1.0,
    profilesSampleRate: 1.0,
    enableAutoPerformanceTracing: true,
    replaysSessionSampleRate: isProduction ? 0.05 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      navigationIntegration,
      reactNativeTracingIntegration(),
      appStartIntegration(),
      graphqlIntegration({ endpoints: ['https://7tv.io/v4/gql'] }),
      mobileReplayIntegration({
        maskAllText: true,
        maskAllImages: true,
        maskAllVectors: true,
      }),
    ],
    beforeSend(event) {
      // Keep the store-review prompt gate honest: any error-level event
      // (including unhandled rejections Sentry tracks itself) marks the
      // session so we never ask for a rating in a bad session.
      if (event.level === 'fatal' || event.level === 'error') {
        markSessionError();
      }
      return scrubPii(event);
    },
    beforeSendTransaction(event) {
      return scrubPii(event);
    },
  });

  wrapExpoImage(ExpoImage);

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

export type MonitoringEventName =
  MonitoringErrorName | MonitoringWarningName | MonitoringInfoName;

export type LogMetadata = {
  name?: OpenStringUnion<MonitoringEventName>;
  tags?: Record<string, string | number | boolean | null | undefined>;
  fingerprint?: string[];
  error?: unknown;
  exceptionName?: string;
  [key: string]: unknown;
};

export type OtaMetrics =
  | 'ota.check.started'
  | 'ota.update.available'
  | 'ota.update.fetched'
  | 'ota.update.pending'
  | 'ota.update.alert_shown'
  | 'ota.update.applied';

const RESERVED_LOG_META_KEYS = new Set([
  'name',
  'tags',
  'fingerprint',
  'error',
  'exceptionName',
]);

function extractLogExtra(metadata?: LogMetadata): Record<string, unknown> {
  if (!metadata) {
    return {};
  }
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!RESERVED_LOG_META_KEYS.has(key)) {
      extra[key] = value;
    }
  }
  return extra;
}

function buildSentryException(
  message: string,
  name: string | undefined,
  exceptionName: string | undefined,
  cause: unknown,
): Error {
  const exception =
    cause !== undefined ? new Error(message, { cause }) : new Error(message);
  exception.name = exceptionName ?? name ?? 'Error';
  return exception;
}

export function forwardLogToSentry(entry: {
  level: 'info' | 'warn' | 'error';
  category: string;
  message: string;
  error?: unknown;
  metadata?: LogMetadata;
}): void {
  const { level, category, message, error, metadata } = entry;

  try {
    const name = typeof metadata?.name === 'string' ? metadata.name : undefined;
    const cause = error ?? metadata?.error;
    const headline = name ? `${name}: ${message}` : message;
    const extra: Record<string, unknown> = extractLogExtra(metadata);
    if (cause !== undefined) {
      extra.cause = cause instanceof Error ? cause.toString() : cause;
    }
    // Bound the metadata before it reaches Sentry. Callers can pass arbitrarily
    // large objects (emote lists, WebSocket payloads, API responses); left raw
    // they bloat the event and have OOM-aborted envelope serialization on the
    // JS thread on low-memory devices (FOAM-TV-MOBILE-9V).
    const safeExtra = sanitiseLogValue(extra) as Record<string, unknown>;

    if (level === 'error') {
      Sentry.addBreadcrumb({ category, message: headline, level: 'error' });

      Sentry.withScope(scope => {
        scope.setTag('log_category', category);
        if (name) {
          scope.setTag('error_type', name);
        }
        if (metadata?.tags) {
          for (const [key, value] of Object.entries(metadata.tags)) {
            scope.setTag(key, value);
          }
        }
        if (metadata?.fingerprint) {
          scope.setFingerprint(metadata.fingerprint);
        }
        scope.setContext('log_metadata', safeExtra);

        const exception =
          cause instanceof Error
            ? cause
            : buildSentryException(
                message,
                name,
                metadata?.exceptionName,
                cause,
              );
        Sentry.captureException(exception);
      });
      return;
    }

    Sentry.addBreadcrumb({
      category,
      message: headline,
      level: level === 'warn' ? 'warning' : 'info',
      data: safeExtra,
    });

    if (level === 'warn') {
      Sentry.logger.warn(headline, safeExtra);
    } else {
      Sentry.logger.info(headline, safeExtra);
    }
  } catch {
    // ignore
  }
}

export function countOtaMetric(
  name: OtaMetrics,
  attributes?: Record<string, string | number | boolean>,
  value = 1,
): void {
  countMetric(name, attributes, value);
}
