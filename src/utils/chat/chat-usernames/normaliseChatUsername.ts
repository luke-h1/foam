import { stripMentionPrefix } from '@app/utils/chat/chat-usernames/stripMentionPrefix';

export function normaliseChatUsername(value?: string | null): string {
  return stripMentionPrefix(value).toLowerCase();
}
