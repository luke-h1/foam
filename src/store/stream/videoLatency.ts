import { observable } from '@legendapp/state';

// Most recent broadcaster latency (seconds). Plain module signal, not a reactive store: the
// chat-ingest hot path peeks it, so it must never trigger a re-render. null = unknown.
let broadcasterLatencySeconds: number | null = null;

// Display-only mirror for the latency pill, so only the badge re-renders — never the chat list.
export const videoLatencyDisplay$ = observable<number | null>(null);

export function setMeasuredVideoLatencySeconds(seconds: number | null): void {
  const next =
    typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
      ? seconds
      : null;
  broadcasterLatencySeconds = next;
  if (videoLatencyDisplay$.peek() !== next) {
    videoLatencyDisplay$.set(next);
  }
}

export function getMeasuredVideoLatencySeconds(): number | null {
  return broadcasterLatencySeconds;
}
