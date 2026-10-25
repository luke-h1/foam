import { clearMentionSessionCaches } from '@app/store/chat/actions/chat-color-caches';
import { mentionChatterIndex } from '@app/utils/chat/resolve-mention-login/mentionChatterIndex';
import { mentionLoginIndex } from '@app/utils/chat/resolve-mention-login/mentionLoginIndex';

export function clearMentionLoginIndex(): void {
  mentionLoginIndex.clear();
  mentionChatterIndex.clear();
  clearMentionSessionCaches();
}
