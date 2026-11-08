import { mentionChatterIndex } from '@app/utils/chat/resolve-mention-login/mentionChatterIndex';
import { mentionLoginIndex } from '@app/utils/chat/resolve-mention-login/mentionLoginIndex';

export function clearMentionIndexes(): void {
  mentionLoginIndex.clear();
  mentionChatterIndex.clear();
}
