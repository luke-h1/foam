import { mentionLoginIndex } from '@app/utils/chat/resolve-mention-login/mentionLoginIndex';

export function getMentionLogin(login: string): string {
  const trimmed = login.trim();

  if (!trimmed) {
    return trimmed;
  }

  return mentionLoginIndex.get(trimmed.toLowerCase()) ?? trimmed;
}
