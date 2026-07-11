import { clearSessionCache } from '@app/store/chat/actions/chatColorCaches';
import { chatStore$ } from '@app/store/chat/observables/chatStore';

export function bumpMentionLoginRevision(): void {
  clearSessionCache('mentionColors');
  chatStore$.mentionLoginRevision.set(revision => (revision ?? 0) + 1);
}
