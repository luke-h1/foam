import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { capMentionIndex } from '@app/utils/chat/resolveMentionLogin/capMentionIndex';
import { getMentionLogin } from '@app/utils/chat/resolveMentionLogin/getMentionLogin';
import { mentionChatterIndex } from '@app/utils/chat/resolveMentionLogin/mentionChatterIndex';
import { registerMentionLogin } from '@app/utils/chat/resolveMentionLogin/registerMentionLogin';
import type { ChatterRole } from '@app/utils/chat/resolveMentionLogin/types';

export function registerMentionChatter({
  login,
  userId,
  color,
  role,
}: {
  login?: string | null;
  userId?: string | null;
  color?: string | null;
  role?: ChatterRole;
}): void {
  const trimmedLogin = login?.trim();
  if (!trimmedLogin) {
    return;
  }

  registerMentionLogin(trimmedLogin);
  const canonicalLogin = getMentionLogin(trimmedLogin);
  const key = canonicalLogin.toLowerCase();
  const existing = mentionChatterIndex.get(key);
  const resolvedUserId = userId?.trim() || existing?.userId || key;
  const resolvedColor =
    color?.trim() ||
    existing?.color ||
    generateRandomTwitchColor(canonicalLogin);

  mentionChatterIndex.set(key, {
    login: canonicalLogin,
    userId: resolvedUserId,
    color: resolvedColor,
    // Mention-only registrations carry no role, so keep the last known one
    // rather than clearing it.
    role: role ?? existing?.role,
  });
  capMentionIndex(mentionChatterIndex);
}
