import type { ContextPreviewValue } from '@app/constants/chat-preferences';
import { usePreference } from '@app/store/preference-store';

export function useContextPreview(): ContextPreviewValue {
  const chatTimestamps = usePreference('chatTimestamps');
  const highlightOwnMentions = usePreference('highlightOwnMentions');
  const showInlineReplyContext = usePreference('showInlineReplyContext');
  const showUnreadJumpPill = usePreference('showUnreadJumpPill');

  return {
    chatTimestamps,
    highlightOwnMentions,
    showInlineReplyContext,
    showUnreadJumpPill,
  };
}
