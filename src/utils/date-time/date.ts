import { format } from 'date-fns/format';

export type DatePattern = 'dd/MM/yy' | 'HH:mm' | 'h:mm a' | 'MMMM d yyyy';

export function formatDate(
  date: Date | string | number,
  pattern: DatePattern = 'dd/MM/yy',
): string {
  return format(new Date(date), pattern);
}
