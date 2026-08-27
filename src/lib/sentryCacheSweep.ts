import { Directory, Paths } from 'expo-file-system';

/**
 * Anything bigger is an envelope the server would reject (profile envelopes
 * hit ~80MB, FOAM-TV-MOBILE-1C); legitimate ones stay low single-digit MB.
 */
const MAX_CACHED_ENVELOPE_BYTES = 8 * 1024 * 1024;

/**
 * Deletes oversized envelopes from the native Sentry disk cache: a stuck one
 * wedges the install in an OOM crash loop until the file disappears.
 */
export function sweepOversizedSentryEnvelopesNow(): void {
  for (const dirName of ['io.sentry', 'sentry']) {
    try {
      sweepDirectory(new Directory(Paths.cache, dirName));
    } catch {
      // best-effort: cache hygiene must never break app boot
    }
  }
}

export function sweepOversizedSentryEnvelopes(): void {
  // Deferred off boot: the file only needs to be gone before the transport retries, not before first frame.
  setTimeout(sweepOversizedSentryEnvelopesNow, 0);
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
