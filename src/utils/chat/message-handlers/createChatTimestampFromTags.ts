import type { ChatTimestampFormat } from '@app/types/chat/chatTimestampFormat';

import { createChatTimestamp } from './createChatTimestamp';

export function createChatTimestampFromTags(
  tags: {
    'tmi-sent-ts'?: string;
  },
  timestampFormat: ChatTimestampFormat,
): string {
  const sentTs = tags['tmi-sent-ts'];

  const parsed = sentTs ? Number.parseInt(sentTs, 10) : Number.NaN;

  return Number.isFinite(parsed)
    ? createChatTimestamp(timestampFormat, parsed)
    : createChatTimestamp(timestampFormat);
}
