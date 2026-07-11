import { mentionChatterIndex } from '@app/utils/chat/resolveMentionLogin/mentionChatterIndex';
import type { MentionChatter } from '@app/utils/chat/resolveMentionLogin/types';

export function getAllMentionChatters(): MentionChatter[] {
  return Array.from(mentionChatterIndex.values());
}
