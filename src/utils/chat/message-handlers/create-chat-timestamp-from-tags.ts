import { createChatTimestamp } from './create-chat-timestamp';

export function createChatTimestampFromTags(tags: {
  'tmi-sent-ts'?: string;
}): string {
  const sentTs = tags['tmi-sent-ts'];

  const parsed = sentTs ? Number.parseInt(sentTs, 10) : Number.NaN;

  return Number.isFinite(parsed)
    ? createChatTimestamp(parsed)
    : createChatTimestamp();
}
