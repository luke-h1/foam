import { differenceInMinutes } from 'date-fns';

export default function elapsedStreamTime(start: string) {
  const now = new Date();

  // Get the difference in minutes
  const diffInMinutes = differenceInMinutes(now, start);

  // Convert the difference to hours and minutes
  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;

  // Format hours and minutes with leading zeros if less than 10
  const formattedHours = hours > 0 ? String(hours).padStart(2, '0') : '';
  const formattedMinutes = String(minutes).padStart(2, '0');

  // Display the result
  const result =
    hours > 0
      ? `${formattedHours}h ${formattedMinutes}m`
      : `${formattedMinutes}m`;

  return result;
}
