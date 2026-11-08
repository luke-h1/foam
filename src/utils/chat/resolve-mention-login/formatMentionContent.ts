import { stripMentionPrefix } from '@app/utils/chat/chat-usernames/stripMentionPrefix';
import { getMentionLogin } from '@app/utils/chat/resolve-mention-login/getMentionLogin';

export function formatMentionContent(mentionContent: string): string {
  const login = stripMentionPrefix(mentionContent);

  if (!login) {
    return mentionContent;
  }

  return `@${getMentionLogin(login)}`;
}
