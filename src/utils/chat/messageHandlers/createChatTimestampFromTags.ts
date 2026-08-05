import { createChatTimestamp } from './createChatTimestamp';

export function createChatTimestampFromTags(tags: {
  'tmi-sent-ts'?: string;
}): string {
  const sentTs = tags['tmi-sent-ts'];
  if (sentTs) {
    const parsed = Number.parseInt(sentTs, 10);
    if (Number.isFinite(parsed)) {
      return createChatTimestamp(parsed);
    }
  }

  return createChatTimestamp();
}
