import { getMentionLogin } from '@app/utils/chat/resolve-mention-login/get-mention-login';

export function formatMentionContent(mentionContent: string): string {
  const login = mentionContent.replace(/^@/, '').trim();

  if (!login) {
    return mentionContent;
  }

  return `@${getMentionLogin(login)}`;
}
