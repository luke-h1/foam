import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';

export function coerceUserNoticeTags(
  tags: Record<string, string>,
): UserNoticeTags {
  return tags as UserNoticeTags;
}
