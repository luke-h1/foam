import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { stripMentionPrefix } from '@app/utils/chat/chat-usernames/stripMentionPrefix';
import { mentionLoginIndex } from '@app/utils/chat/resolve-mention-login/mentionLoginIndex';
import { pickCanonicalLogin } from '@app/utils/chat/resolve-mention-login/pickCanonicalLogin';
import { setMentionIndexEntry } from '@app/utils/chat/resolve-mention-login/setMentionIndexEntry';

export function registerMentionLogin(login?: string | null): void {
  const trimmed = stripMentionPrefix(login);

  if (!trimmed) {
    return;
  }

  const key = normaliseChatUsername(trimmed);
  const next = pickCanonicalLogin(mentionLoginIndex.get(key), trimmed);

  if (next === mentionLoginIndex.get(key)) {
    return;
  }

  setMentionIndexEntry(mentionLoginIndex, key, next);
}
