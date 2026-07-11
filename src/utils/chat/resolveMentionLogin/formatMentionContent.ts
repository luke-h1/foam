import { getMentionLogin } from '@app/utils/chat/resolveMentionLogin/getMentionLogin';

export function formatMentionContent(mentionContent: string): string {
  const login = mentionContent.replace(/^@/, '').trim();
  if (!login) {
    return mentionContent;
  }

  return `@${getMentionLogin(login)}`;
}
