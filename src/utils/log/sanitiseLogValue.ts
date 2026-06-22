const MAX_LOG_STRING_LENGTH = 500;
const MAX_LOG_ARRAY_PREVIEW = 3;
const MAX_LOG_OBJECT_KEYS = 12;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmoteLike(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.url === 'string' &&
    typeof value.site === 'string'
  );
}

function summariseHomogeneousArray(value: unknown[]): string | null {
  if (value.length === 0) {
    return '[]';
  }

  const first = value[0];
  if (isEmoteLike(first)) {
    const site = typeof first.site === 'string' ? first.site : 'emote';
    return `[Array(${value.length}) ${site} emotes]`;
  }

  return null;
}

/**
 * Bounds an arbitrary value to a small, safe shape for logging and crash
 * reporting: caps string length, previews long arrays, summarises emote
 * arrays, limits object breadth, and breaks circular references. Used both for
 * the console log message and — critically — for the metadata forwarded to
 * Sentry, so a caller passing a huge object (an emote list, a WebSocket
 * payload, an API response) can't blow up envelope serialization on-device.
 */
export function sanitiseLogValue(value: string, seen?: WeakSet<object>): string;
export function sanitiseLogValue(
  value: unknown,
  seen?: WeakSet<object>,
): unknown;
export function sanitiseLogValue(value: unknown, seen = new WeakSet<object>()) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === 'string') {
    return value.length > MAX_LOG_STRING_LENGTH
      ? `${value.slice(0, MAX_LOG_STRING_LENGTH)}... [truncated]`
      : value;
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
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (isEmoteLike(value)) {
    return {
      id: value.id,
      name: value.name,
      site: value.site,
    };
  }

  const result: Record<string, unknown> = {};
  const entries = Object.entries(value);
  for (const [key, nestedValue] of entries.slice(0, MAX_LOG_OBJECT_KEYS)) {
    result[key] = sanitiseLogValue(nestedValue, seen);
  }
  if (entries.length > MAX_LOG_OBJECT_KEYS) {
    result.__truncatedKeys = entries.length - MAX_LOG_OBJECT_KEYS;
  }

  return result;
}
