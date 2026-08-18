import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';

export function coerceUserNoticeTags(
  tags: Record<string, string>,
): UserNoticeTags {
  // SAFETY: callers only reach this with the tag map of a USERNOTICE line, which always carries msg-id.
  return tags as UserNoticeTags;
}
