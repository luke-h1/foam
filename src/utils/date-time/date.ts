import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

export type DatePattern = 'DD/MM/YY' | 'HH:mm' | 'MMMM D YYYY';

export function formatDate(
  date: Date | string | number,
  pattern: DatePattern = 'DD/MM/YY',
): string {
  return dayjs(date).format(pattern);
}
