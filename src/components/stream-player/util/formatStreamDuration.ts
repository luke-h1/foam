import { formatClockDuration } from '@app/utils/date-time/formatClockDuration';

export function formatDuration(startedAt?: string): string {
  if (!startedAt) {
    return '0:00';
  }

  const start = new Date(startedAt).getTime();

  return formatClockDuration(Math.floor((Date.now() - start) / 1000));
}
