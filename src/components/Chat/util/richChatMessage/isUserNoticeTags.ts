import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';

export function isUserNoticeTags(tags: unknown): tags is UserNoticeTags {
  return (
    typeof tags === 'object' &&
    tags !== null &&
    'msg-id' in tags &&
    typeof (tags as { 'msg-id'?: unknown })['msg-id'] === 'string'
  );
}
