import { Directory, Paths } from 'expo-file-system';

/**
 * Anything bigger than this in Sentry's disk cache is an envelope the server
 * would reject anyway (profile envelopes reached ~80MB, FOAM-TV-MOBILE-1C).
 * Legitimate envelopes (events with screenshot/view-hierarchy attachments,
 * replay segments, transactions) stay in the low single-digit MB.
 */
const MAX_CACHED_ENVELOPE_BYTES = 8 * 1024 * 1024;

/**
 * Deletes oversized envelopes from the native Sentry SDK's disk cache
 * (Caches/io.sentry on iOS, cacheDir/sentry on Android) before the transport
 * gets stuck on them. The transport keeps an envelope on disk whenever an
 * upload dies without an HTTP response, and re-reads it with a full in-memory
 * copy on every retry - an oversized envelope therefore wedges the install in
 * an OOM crash loop that only ends when the file disappears.
 */
export function sweepOversizedSentryEnvelopes(): void {
  for (const dirName of ['io.sentry', 'sentry']) {
    try {
      sweepDirectory(new Directory(Paths.cache, dirName));
    } catch {
      // best-effort: cache hygiene must never break app boot
    }
  }
}

function sweepDirectory(dir: Directory): void {
  if (!dir.exists) {
    return;
  }
  for (const entry of dir.list()) {
    try {
      if (entry instanceof Directory) {
        sweepDirectory(entry);
      } else if ((entry.size ?? 0) > MAX_CACHED_ENVELOPE_BYTES) {
        entry.delete();
      }
    } catch {
      // skip undeletable entries; the rest of the sweep still runs
    }
  }
}
