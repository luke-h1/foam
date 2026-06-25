import { observable } from '@legendapp/state';

// Display-only mirror for the latency pill, so only the badge re-renders — never the chat list.
export const videoLatencyDisplay$ = observable<number | null>(null);

export function setMeasuredVideoLatencySeconds(seconds: number | null): void {
  const next =
    typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
      ? seconds
      : null;
  if (videoLatencyDisplay$.peek() !== next) {
    videoLatencyDisplay$.set(next);
  }
}
