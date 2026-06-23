/**
 * The player's most recent broadcaster latency reading (seconds), published by
 * the stream player and read imperatively by the chat-delay auto-sync. It is a
 * plain module signal rather than a reactive store on purpose: the only reader
 * peeks it on the chat ingest hot path, so it must never trigger a re-render,
 * and it updates roughly every few seconds while the player is open.
 *
 * `null` means "unknown" (no player open, or no live reading yet) — auto-sync
 * falls back to no delay in that case.
 */
let broadcasterLatencySeconds: number | null = null;

export function setMeasuredVideoLatencySeconds(seconds: number | null): void {
  broadcasterLatencySeconds =
    typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
      ? seconds
      : null;
}

export function getMeasuredVideoLatencySeconds(): number | null {
  return broadcasterLatencySeconds;
}
