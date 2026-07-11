/**
 * Short-lived render caches for chat colours. These are read imperatively on
 * the raw ingest path (`resolveCachedSenderColor`, up to ~100 msg/s) and
 * mid-render (`getMentionColor`), never subscribed - so they are plain Maps
 * per the chat-state rule; an observable write would clone and key-diff the
 * whole bucket on every message.
 *
 * `lightenedColors` memoizes `lightenColor(color)`, a pure function of the
 * key, so entries never expire - the size cap alone bounds memory.
 *
 * `mentionColors` keeps a TTL as a staleness backstop (a chatter's colour
 * can change mid-session) on top of the explicit clear the mention resolver
 * issues when logins resolve.
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

const buckets: Record<SessionCacheBucket, Map<string, TimedStringEntry>> = {
  mentionColors: new Map(),
  lightenedColors: new Map(),
};

const NEVER_EXPIRES = Number.POSITIVE_INFINITY;

export function getSessionCacheString(
  bucket: SessionCacheBucket,
  key: string,
): string | undefined {
  const entries = buckets[bucket];
  const entry = entries.get(key);
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    entries.delete(key);
    return undefined;
  }

  return entry.value;
}

export function setSessionCacheString(
  bucket: SessionCacheBucket,
  key: string,
  value: string,
): void {
  const entries = buckets[bucket];
  entries.set(key, {
    value,
    expiresAt:
      bucket === 'lightenedColors'
        ? NEVER_EXPIRES
        : Date.now() + CHAT_SESSION_CACHE_TTL_MS,
  });

  const maxSize = MAX_SESSION_CACHE_SIZES[bucket];
  if (entries.size <= maxSize) {
    return;
  }
  // Rare overflow path: drop oldest-inserted entries down to the cap.
  const dropCount = entries.size - maxSize;
  let dropped = 0;
  for (const oldestKey of entries.keys()) {
    if (dropped >= dropCount) {
      break;
    }
    entries.delete(oldestKey);
    dropped += 1;
  }
}

export function clearSessionCache(bucket?: SessionCacheBucket): void {
  if (bucket) {
    buckets[bucket].clear();
    return;
  }

  buckets.mentionColors.clear();
  buckets.lightenedColors.clear();
}

export function clearMentionSessionCaches(): void {
  clearSessionCache('mentionColors');
  clearSessionCache('lightenedColors');
}
