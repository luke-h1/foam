import type { ChatTimestampFormat } from '@app/types/chat/chatTimestampFormat';
import { formatDate } from '@app/utils/date-time/date';

export function createChatTimestamp(
  timestampFormat: ChatTimestampFormat,
  date: Date | number = Date.now(),
): string {
  return formatDate(date, timestampFormat === '12h' ? 'h:mm a' : 'HH:mm');
}
