import { chatStore$ } from '../observables/chatStore';

/**
 * Short-lived render caches — not persisted, trimmed aggressively for memory.
 */
export const CHAT_SESSION_CACHE_TTL_MS = 30_000;

export type SessionCacheBucket = 'mentionColors' | 'lightenedColors';

type TimedStringEntry = {
  value: string;
  expiresAt: number;
};

const MAX_SESSION_CACHE_SIZES: Record<SessionCacheBucket, number> = {
  mentionColors: 500,
  lightenedColors: 200,
};

function getBucket(bucket: SessionCacheBucket) {
  return chatStore$.sessionCaches[bucket];
}

function readBucket(
  bucket: SessionCacheBucket,
): Record<string, TimedStringEntry> {
  return getBucket(bucket).peek() ?? {};
}

export function getSessionCacheString(
  bucket: SessionCacheBucket,
  key: string,
): string | undefined {
  const entry = readBucket(bucket)[key];
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    const next = { ...readBucket(bucket) };
    delete next[key];
    getBucket(bucket).set(next);
    return undefined;
  }

  return entry.value;
}

export function setSessionCacheString(
  bucket: SessionCacheBucket,
  key: string,
  value: string,
): void {
  getBucket(bucket).set({
    ...readBucket(bucket),
    [key]: {
      value,
      expiresAt: Date.now() + CHAT_SESSION_CACHE_TTL_MS,
    },
  });
  pruneSessionCache(bucket);
}

function pruneSessionCache(bucket: SessionCacheBucket): void {
  const now = Date.now();
  const entries = Object.entries(readBucket(bucket)).filter(
    ([, entry]) => entry.expiresAt > now,
  );
  const maxSize = MAX_SESSION_CACHE_SIZES[bucket];

  if (entries.length <= maxSize) {
    if (entries.length !== Object.keys(readBucket(bucket)).length) {
      getBucket(bucket).set(Object.fromEntries(entries));
    }
    return;
  }

  entries.sort((left, right) => left[1].expiresAt - right[1].expiresAt);
  getBucket(bucket).set(
    Object.fromEntries(entries.slice(entries.length - maxSize)),
  );
}

export function clearSessionCache(bucket?: SessionCacheBucket): void {
  if (bucket) {
    getBucket(bucket).set({});
    return;
  }

  chatStore$.sessionCaches.set({
    mentionColors: {},
    lightenedColors: {},
  });
}

export function clearMentionSessionCaches(): void {
  clearSessionCache('mentionColors');
  clearSessionCache('lightenedColors');
}
