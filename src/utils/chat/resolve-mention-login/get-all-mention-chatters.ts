import { mentionChatterIndex } from '@app/utils/chat/resolve-mention-login/mention-chatter-index';
import type { MentionChatter } from '@app/utils/chat/resolve-mention-login/types';

export function getAllMentionChatters(): MentionChatter[] {
  return Array.from(mentionChatterIndex.values());
}
