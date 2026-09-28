import { flushTimer } from '@app/utils/chat/mention-login-resolver/flush-timer';
import { lastMentionSearchQuery } from '@app/utils/chat/mention-login-resolver/last-mention-search-query';
import { mentionSearchRequestId } from '@app/utils/chat/mention-login-resolver/mention-search-request-id';
import { mentionSearchTimer } from '@app/utils/chat/mention-login-resolver/mention-search-timer';
import { pendingLogins } from '@app/utils/chat/mention-login-resolver/pending-logins';

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
