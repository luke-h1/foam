import { observable } from '@legendapp/state';

// Display-only value for the latency pill. Only the pill subscribes, so the chat list does not re-render.
export const videoLatencyDisplay$ = observable<number | null>(null);

export function setMeasuredVideoLatencySeconds(seconds: number | null): void {
  const next =
    seconds !== null && Number.isFinite(seconds) && seconds > 0
      ? seconds
      : null;
  if (videoLatencyDisplay$.peek() !== next) {
    videoLatencyDisplay$.set(next);
  }
}
