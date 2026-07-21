import { videoLatencyDisplay$ } from '@app/store/stream/observables/videoLatency';

export function setMeasuredVideoLatencySeconds(seconds: number | null): void {
  const next =
    typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
      ? seconds
      : null;
  if (videoLatencyDisplay$.peek() !== next) {
    videoLatencyDisplay$.set(next);
  }
}
