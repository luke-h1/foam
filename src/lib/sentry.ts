import * as Sentry from '@sentry/react-native';
import {
  appStartIntegration,
  expoRouterIntegration,
  graphqlIntegration,
  init as initSentry,
  mobileReplayIntegration,
  reactNativeTracingIntegration,
} from '@sentry/react-native';
import { Image as ExpoImage } from 'expo-image';

import { instrumentExpoImageLoads } from '@app/lib/sentryImageSpans';
import { sanitiseLogValue } from '@app/utils/log/sanitiseLogValue';
import { markSessionError } from '@app/utils/storeReview/sessionErrorFlag';
import type { OpenStringUnion } from '@app/utils/typescript/OpenStringUnion';

/**
 * Auto-instruments Expo Router navigation; no manual
 * registerNavigationContainer call is needed.
 */
export const navigationIntegration = expoRouterIntegration({
  enableTimeToInitialDisplay: true,
  enablePrefetchTracking: true,
  enableTimeToInitialDisplayForPreloadedRoutes: true,
  useDispatchedActionData: true,
});

let didInitializeSentry = false;

/**
 * Strips PII before an event leaves the device; feedback email lives on the
 * feedback context, not event.user, so it is unaffected.
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

  // A release build with no DSN silently captures nothing; be loud in device logs.
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
     * Production samples replay/tracing down (measured JS-thread cost);
     * profilesSampleRate stays unset - profile envelopes OOM-crashed the app (FOAM-TV-MOBILE-1C).
     */
    tracesSampleRate: isProduction ? 0.15 : 1.0,
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
      // Any error-level event marks the session so the store-review prompt never fires in a bad session.
      if (event.level === 'fatal' || event.level === 'error') {
        markSessionError();
      }
      return scrubPii(event);
    },
    beforeSendTransaction(event) {
      return scrubPii(event);
    },
  });

  instrumentExpoImageLoads(ExpoImage);

  didInitializeSentry = true;
}

export function flushSentry(): Promise<boolean> {
  return Sentry.flush();
}

/**
 * Sends a message event and flushes, so a TestFlight build can confirm the
 * whole pipeline works.
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

type SentryRootComponent = Parameters<typeof Sentry.wrap>[0];

export function wrapWithSentry(RootComponent: SentryRootComponent) {
  return Sentry.wrap(RootComponent);
}

export function showFeedbackWidget(): void {
  init();
  Sentry.showFeedbackWidget();
}

export type FeedbackType = 'bug' | 'idea';

/**
 * Tagged with the feedback type so bugs and ideas triage separately in Sentry.
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

export type Span = Sentry.Span;

export type SpanOutcome = 'ok' | 'error' | 'cancelled';

/**
 * Span not bound to the current scope; for work that finishes outside the
 * creating call stack (e.g. player load).
 */
export function startInactiveSpan(
  name: string,
  op: string,
  attributes?: Record<string, string | number | boolean>,
): Sentry.Span | undefined {
  init();
  if (!sentryStatus.enabled) {
    return undefined;
  }
  return Sentry.startInactiveSpan({ name, op, attributes });
}

export function endSpan(
  span: Sentry.Span | undefined,
  outcome: SpanOutcome,
): void {
  if (!span) {
    return;
  }
  if (outcome === 'ok') {
    span.setStatus({ code: 1, message: 'ok' });
  } else if (outcome === 'error') {
    span.setStatus({ code: 2, message: 'internal_error' });
  } else {
    span.setStatus({ code: 2, message: 'cancelled' });
  }
  span.end();
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

/**
 * The widest shape sanitiseLogValue can bound before it reaches Sentry.
 */
export type LogMetadataValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | readonly LogMetadataValue[]
  | { readonly [key: string]: LogMetadataValue };

export type LogTagValue = string | number | boolean | null | undefined;

export type LogMetadata = {
  name?: OpenStringUnion<MonitoringEventName>;
  tags?: Record<string, LogTagValue>;
  fingerprint?: string[];
  error?: LogMetadataValue;
  exceptionName?: string;
  [key: string]: LogMetadataValue;
};

export type OtaMetrics =
  | 'ota.check.started'
  | 'ota.update.available'
  | 'ota.update.fetched'
  | 'ota.update.pending'
  | 'ota.update.alert_shown'
  | 'ota.update.applied'
  | 'ota.update.deferred';

const RESERVED_LOG_META_KEYS = new Set([
  'name',
  'tags',
  'fingerprint',
  'error',
  'exceptionName',
]);

function extractLogExtra(metadata?: LogMetadata) {
  const extra: Record<string, LogMetadataValue> = {};
  if (!metadata) {
    return extra;
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (!RESERVED_LOG_META_KEYS.has(key)) {
      extra[key] = value;
    }
  }
  return extra;
}

/**
 * Sentry's own tag-value ceiling; truncating here keeps the value
 * deterministic instead of ingest-side truncation.
 */
const MAX_TAG_VALUE_LENGTH = 200;
/**
 * sanitiseLogValue never sees the tags, so they need their own bound
 * (FOAM-TV-MOBILE-9V).
 */
const MAX_TAGS = 24;

function applyLogScope(
  scope: Sentry.Scope,
  {
    category,
    name,
    metadata,
    safeExtra,
  }: {
    category: string;
    name?: string;
    metadata?: LogMetadata;
    safeExtra: Record<string, LogMetadataValue>;
  },
): void {
  // Caller tags go first so the canonical log_category/error_type pair below always wins.
  if (metadata?.tags) {
    let applied = 0;
    for (const [key, value] of Object.entries(metadata.tags)) {
      if (applied >= MAX_TAGS) {
        break;
      }
      if (!key || value === undefined || value === null) {
        continue;
      }
      applied += 1;
      const text = String(value);
      scope.setTag(
        key,
        text.length > MAX_TAG_VALUE_LENGTH
          ? text.slice(0, MAX_TAG_VALUE_LENGTH)
          : value,
      );
    }
  }

  scope.setTag('log_category', category);
  if (name) {
    scope.setTag('error_type', name);
  }
  if (metadata?.fingerprint) {
    scope.setFingerprint(metadata.fingerprint);
  }
  scope.setContext('log_metadata', safeExtra);
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
    const name = metadata?.name;
    const cause = error ?? metadata?.error;
    const headline = name ? `${name}: ${message}` : message;
    const extra = extractLogExtra(metadata);
    if (cause !== undefined) {
      // SAFETY: an arbitrary thrown value is held as metadata here and bounded by sanitiseLogValue with the rest of the extra below.
      extra.cause = (
        cause instanceof Error ? cause.toString() : cause
      ) as LogMetadataValue;
    }
    // Bound metadata first: raw caller objects have OOM-aborted envelope serialization (FOAM-TV-MOBILE-9V).
    // SAFETY: sanitiseLogValue maps a record to a record of the bounded values it produces.
    const safeExtra = sanitiseLogValue(extra) as Record<
      string,
      LogMetadataValue
    >;

    if (level === 'error') {
      Sentry.addBreadcrumb({ category, message: headline, level: 'error' });

      Sentry.withScope(scope => {
        applyLogScope(scope, { category, name, metadata, safeExtra });

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
      // Warns stay structured logs, not issues: they are degraded-but-handled paths nobody should be paged for.
      Sentry.logger.warn(headline, safeExtra);
      return;
    }

    Sentry.logger.info(headline, safeExtra);
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
