import type { TimedCacheEntry } from '@app/utils/chat/shared-chat-badges/types';
import { setBoundedMapEntry } from '@app/utils/collection/setBoundedMapEntry';

/**
 * Render caches for chat colours, read imperatively at up to ~100 msg/s and
 * never subscribed - plain Maps per the chat-state rule.
 */
const CHAT_SESSION_CACHE_TTL_MS = 30_000;

export type SessionCacheBucket = 'mentionColors' | 'lightenedColors';

type TimedStringEntry = TimedCacheEntry<string>;

const MAX_SESSION_CACHE_SIZES = {
  mentionColors: 500,
  lightenedColors: 200,
} satisfies Record<SessionCacheBucket, number>;

const buckets = {
  mentionColors: new Map<string, TimedStringEntry>(),
  lightenedColors: new Map<string, TimedStringEntry>(),
} satisfies Record<SessionCacheBucket, Map<string, TimedStringEntry>>;

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
  setBoundedMapEntry(
    buckets[bucket],
    key,
    {
      value,
      expiresAt:
        bucket === 'lightenedColors'
          ? NEVER_EXPIRES
          : Date.now() + CHAT_SESSION_CACHE_TTL_MS,
    },
    MAX_SESSION_CACHE_SIZES[bucket],
  );
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
