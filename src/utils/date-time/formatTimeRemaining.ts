import { formatClockDuration } from '@app/utils/date-time/formatClockDuration';

export function formatTimeRemaining(remainingMs: number): string {
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  if (remainingSeconds >= 60) {
    return `${formatClockDuration(remainingSeconds)} left`;
  }

  return `${remainingSeconds}s left`;
}
