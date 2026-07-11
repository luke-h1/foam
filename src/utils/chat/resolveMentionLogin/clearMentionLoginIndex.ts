import { clearMentionSessionCaches } from '@app/store/chat/actions/chatColorCaches';
import { mentionChatterIndex } from '@app/utils/chat/resolveMentionLogin/mentionChatterIndex';
import { mentionLoginIndex } from '@app/utils/chat/resolveMentionLogin/mentionLoginIndex';

export function clearMentionLoginIndex(): void {
  mentionLoginIndex.clear();
  mentionChatterIndex.clear();
  clearMentionSessionCaches();
}
