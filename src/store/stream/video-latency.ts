import { observable } from '@legendapp/state';

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
