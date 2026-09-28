import { clearMentionSessionCaches } from '@app/store/chat/actions/chat-color-caches';
import { mentionChatterIndex } from '@app/utils/chat/resolve-mention-login/mention-chatter-index';
import { mentionLoginIndex } from '@app/utils/chat/resolve-mention-login/mention-login-index';

export function clearMentionLoginIndex(): void {
  mentionLoginIndex.clear();
  mentionChatterIndex.clear();
  clearMentionSessionCaches();
}
