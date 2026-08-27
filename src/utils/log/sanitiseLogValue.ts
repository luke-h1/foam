import { z } from 'zod';

import type { LogMetadataValue } from '@app/lib/sentry';

const MAX_LOG_STRING_LENGTH = 500;
const MAX_LOG_ARRAY_PREVIEW = 3;
const MAX_LOG_OBJECT_KEYS = 12;

const logStringSchema = z.string();

const loggableEmoteSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  site: z.string(),
});

/**
 * Accepts exactly what the old plain-object typeof check accepted, so the
 * record branch below is unchanged.
 */
const looseObjectSchema = z.looseObject({});

export function isRecord<T>(
  value: T,
): value is T & Record<string, LogMetadataValue> {
  return looseObjectSchema.safeParse(value).success;
}

function summariseHomogeneousArray(value: unknown[]): string | null {
  if (value.length === 0) {
    return '[]';
  }

  const emote = loggableEmoteSchema.safeParse(value[0]);
  if (emote.success) {
    return `[Array(${value.length}) ${emote.data.site} emotes]`;
  }

  return null;
}

/**
 * Bounds an arbitrary value so a huge object can't blow up Sentry envelope
 * serialization on-device.
 */
export function sanitiseLogValue(value: string, seen?: WeakSet<object>): string;
export function sanitiseLogValue<T>(
  value: T,
  seen?: WeakSet<object>,
): LogMetadataValue;
export function sanitiseLogValue<T>(
  value: T,
  seen = new WeakSet<object>(),
): LogMetadataValue {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  const stringValue = logStringSchema.safeParse(value);
  if (stringValue.success) {
    return stringValue.data.length > MAX_LOG_STRING_LENGTH
      ? `${stringValue.data.slice(0, MAX_LOG_STRING_LENGTH)}... [truncated]`
      : stringValue.data;
  }

  if (Array.isArray(value)) {
    const summary = summariseHomogeneousArray(value);
    if (summary) {
      return summary;
    }

    if (value.length > MAX_LOG_ARRAY_PREVIEW) {
      return {
        length: value.length,
        preview: value
          .slice(0, MAX_LOG_ARRAY_PREVIEW)
          .map(item => sanitiseLogValue(item, seen)),
      };
    }

    return value.map(item => sanitiseLogValue(item, seen));
  }

  if (!isRecord(value)) {
    // SAFETY: value already failed the Error, string, array, and record checks above, so it is a primitive or non-plain-object value returned unchanged.
    return value as LogMetadataValue;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  const emote = loggableEmoteSchema.safeParse(value);
  if (emote.success) {
    return {
      id: emote.data.id,
      name: emote.data.name,
      site: emote.data.site,
    };
  }

  const entries = Object.entries(value);
  const result = Object.fromEntries(
    entries
      .slice(0, MAX_LOG_OBJECT_KEYS)
      .map(([key, nestedValue]): [string, LogMetadataValue] => [
        key,
        sanitiseLogValue(nestedValue, seen),
      ]),
  );
  if (entries.length > MAX_LOG_OBJECT_KEYS) {
    result.__truncatedKeys = entries.length - MAX_LOG_OBJECT_KEYS;
  }

  return result;
}
