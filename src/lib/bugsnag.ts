import type { ComponentType, FC } from 'react';

import Bugsnag from '@bugsnag/expo';
import BugsnagPerformance from '@bugsnag/expo-performance';
import * as Updates from 'expo-updates';

import type { LogMetadata } from '@app/lib/sentry';
import { sanitiseLogValue } from '@app/utils/log/sanitiseLogValue';

let didInitializeBugsnag = false;

export function wrapWithBugsnagAppStart(RootComponent: ComponentType) {
  return BugsnagPerformance.withInstrumentedAppStarts(RootComponent as FC);
}

export function init(): void {
  if (didInitializeBugsnag) {
    return;
  }
  didInitializeBugsnag = true;

  const apiKey = process.env.EXPO_PUBLIC_BUGSNAG_API_KEY;
  const codeBundleId = Updates.updateId ?? undefined;

  Bugsnag.start({ apiKey, codeBundleId });
  BugsnagPerformance.start({ apiKey });
}

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

export function forwardLogToBugsnag(entry: {
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
    // Bound the metadata before it reaches Bugsnag. Callers can pass arbitrarily
    // large objects (emote lists, WebSocket payloads, API responses); left raw
    // they have OOM-aborted payload serialization on the JS thread on
    // low-memory devices (FOAM-TV-MOBILE-9V).
    const extra = sanitiseLogValue(extractLogExtra(metadata)) as Record<
      string,
      unknown
    >;

    if (level === 'error') {
      const exception =
        cause instanceof Error
          ? cause
          : new Error(headline, cause !== undefined ? { cause } : undefined);

      if (!(cause instanceof Error)) {
        exception.name = metadata?.exceptionName ?? name ?? 'Error';
      }

      Bugsnag.notify(exception, event => {
        event.severity = 'error';
        event.context = category;
        event.addMetadata('log', {
          category,
          message: headline,
          ...(name ? { type: name } : {}),
          ...extra,
        });
        if (metadata?.tags) {
          event.addMetadata('tags', metadata.tags);
        }
      });
      return;
    }

    Bugsnag.leaveBreadcrumb(headline, { category, ...extra }, 'log');
  } catch {
    // ignore
  }
}
