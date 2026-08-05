import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import type {
  createOptimisticUserState,
  OptimisticReplyTarget,
  OptimisticSender,
} from '@app/utils/chat/messageHandlers/createOptimisticUserState';
import { formatDate } from '@app/utils/date-time/date';

/**
 * The local echo of a message the user just sent, rendered before IRC echoes
 * it back. `sentAt` doubles as the message id and nonce - the store keys off
 * that pair, and the real message arriving later carries Twitch's own id, so
 * the two never collide.
 */
export function createOptimisticMessage({
  badges,
  channelName,
  isAction,
  messageText,
  replyTo,
  sentAt,
  user,
  userstate,
}: {
  badges: SanitisedBadgeSet[];
  channelName: string;
  isAction: boolean;
  messageText: string;
  replyTo?: OptimisticReplyTarget | null;
  sentAt: number;
  user?: OptimisticSender;
  userstate: ReturnType<typeof createOptimisticUserState>;
}): AnyChatMessageType {
  const messageId = `${sentAt}`;
  const optimisticMessage: AnyChatMessageType = {
    id: `${messageId}_${messageId}`,
    userstate,
    message: [{ type: 'text', content: messageText.trimEnd() }],
    badges,
    channel: channelName,
    message_id: messageId,
    message_nonce: messageId,
    timestamp: formatDate(sentAt, 'HH:mm'),
    sender: user?.display_name || user?.login || '',
    parentDisplayName: replyTo?.username || '',
    replyDisplayName: replyTo?.replyParentUserLogin || '',
    replyBody: replyTo?.message || '',
    parentColor: replyTo?.color,
    ...(isAction ? { isAction: true } : {}),
  };

  return optimisticMessage;
}
