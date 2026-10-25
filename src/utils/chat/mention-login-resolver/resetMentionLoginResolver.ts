import { flushTimer } from '@app/utils/chat/mention-login-resolver/flushTimer';
import { lastMentionSearchQuery } from '@app/utils/chat/mention-login-resolver/lastMentionSearchQuery';
import { mentionSearchRequestId } from '@app/utils/chat/mention-login-resolver/mentionSearchRequestId';
import { mentionSearchTimer } from '@app/utils/chat/mention-login-resolver/mentionSearchTimer';
import { pendingLogins } from '@app/utils/chat/mention-login-resolver/pendingLogins';

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
