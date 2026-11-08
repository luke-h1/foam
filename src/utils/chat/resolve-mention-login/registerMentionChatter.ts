import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { getFallbackSenderColor } from '@app/utils/chat/getFallbackSenderColor';
import { getMentionLogin } from '@app/utils/chat/resolve-mention-login/getMentionLogin';
import { mentionChatterIndex } from '@app/utils/chat/resolve-mention-login/mentionChatterIndex';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/registerMentionLogin';
import { setMentionIndexEntry } from '@app/utils/chat/resolve-mention-login/setMentionIndexEntry';
import type { ChatterRole } from '@app/utils/chat/resolve-mention-login/types';

interface RegisterMentionChatterOptions {
  login?: string | null;
  userId?: string | null;
  color?: string | null;
  role?: ChatterRole;
}

export function registerMentionChatter({
  login,
  userId,
  color,
  role,
}: RegisterMentionChatterOptions): void {
  const trimmedLogin = login?.trim();

  if (!trimmedLogin) {
    return;
  }

  registerMentionLogin(trimmedLogin);
  const canonicalLogin = getMentionLogin(trimmedLogin);
  const key = normaliseChatUsername(canonicalLogin);
  const existing = mentionChatterIndex.get(key);
  const resolvedUserId = userId?.trim() || existing?.userId;

  const resolvedColor =
    color?.trim() || existing?.color || getFallbackSenderColor(canonicalLogin);

  setMentionIndexEntry(mentionChatterIndex, key, {
    login: canonicalLogin,
    userId: resolvedUserId,
    color: resolvedColor,
    // Mention-only registrations carry no role, so keep the last known one
    // rather than clearing it.
    role: role ?? existing?.role,
  });
}
