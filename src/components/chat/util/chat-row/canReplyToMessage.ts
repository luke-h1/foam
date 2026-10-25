import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { ChatBodyVariant } from '@app/utils/chat/derive-chat-body/types';

const NON_REPLYABLE_VARIANTS: ReadonlySet<string> = new Set([
  'stv_emote_event',
  'viewer_milestone',
  'mod_anniversary',
]);

interface CanReplyToMessageOptions {
  bodyVariant: ChatBodyVariant;
  hasReplyHandler: boolean;
  hasSubscriptionNotice: boolean;
  moderationNotice: unknown;
  sender: string | undefined;
  userstate: UserStateTags;
}

/**
 * A row takes a reply only when it is a real user message that a handler is
 * listening for. Moderated rows, notices and the app's own system lines do not.
 */
export function canReplyToMessage({
  bodyVariant,
  hasReplyHandler,
  hasSubscriptionNotice,
  moderationNotice,
  sender,
  userstate,
}: CanReplyToMessageOptions): boolean {
  return Boolean(
    hasReplyHandler &&
    !moderationNotice &&
    !hasSubscriptionNotice &&
    !NON_REPLYABLE_VARIANTS.has(bodyVariant) &&
    userstate.username &&
    sender?.toLowerCase() !== 'system',
  );
}
