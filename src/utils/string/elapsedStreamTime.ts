import { differenceInMinutes } from 'date-fns/differenceInMinutes';

export function elapsedStreamTime(start: string) {
  const diffInMinutes = differenceInMinutes(new Date(), start);
  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');

  if (hours > 0) {
    return `${hours}h ${formattedMinutes}m`;
  }

  return `${formattedMinutes}m`;
}
