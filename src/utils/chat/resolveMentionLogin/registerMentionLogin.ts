import { capMentionIndex } from '@app/utils/chat/resolveMentionLogin/capMentionIndex';
import { mentionLoginIndex } from '@app/utils/chat/resolveMentionLogin/mentionLoginIndex';
import { pickCanonicalLogin } from '@app/utils/chat/resolveMentionLogin/pickCanonicalLogin';

export function registerMentionLogin(login?: string | null): void {
  const trimmed = login?.trim();
  if (!trimmed) {
    return;
  }

  const key = trimmed.toLowerCase();
  const next = pickCanonicalLogin(mentionLoginIndex.get(key), trimmed);
  if (next === mentionLoginIndex.get(key)) {
    return;
  }

  mentionLoginIndex.set(key, next);
  capMentionIndex(mentionLoginIndex);
}
