import { flushTimer } from '@app/utils/chat/mentionLoginResolver/flushTimer';
import { lastMentionSearchQuery } from '@app/utils/chat/mentionLoginResolver/lastMentionSearchQuery';
import { mentionSearchRequestId } from '@app/utils/chat/mentionLoginResolver/mentionSearchRequestId';
import { mentionSearchTimer } from '@app/utils/chat/mentionLoginResolver/mentionSearchTimer';
import { pendingLogins } from '@app/utils/chat/mentionLoginResolver/pendingLogins';

export function resetMentionLoginResolver(): void {
  pendingLogins.clear();
  lastMentionSearchQuery.current = '';
  mentionSearchRequestId.current += 1;
  if (flushTimer.current) {
    clearTimeout(flushTimer.current);
    flushTimer.current = null;
  }
  if (mentionSearchTimer.current) {
    clearTimeout(mentionSearchTimer.current);
    mentionSearchTimer.current = null;
  }
}
