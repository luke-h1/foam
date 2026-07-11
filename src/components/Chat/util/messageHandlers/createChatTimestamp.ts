import { getPreferences } from '@app/store/preferenceStore';
import { formatDate } from '@app/utils/date-time/date';

export function createChatTimestamp(date: Date | number = Date.now()): string {
  const format =
    getPreferences().chatTimestampFormat === '12h' ? 'h:mm a' : 'HH:mm';
  return formatDate(date, format);
}
