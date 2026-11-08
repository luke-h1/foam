import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import type { ChatTimestampFormat } from '@app/types/chat/chatTimestampFormat';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import type {
  createOptimisticUserState,
  OptimisticReplyTarget,
  OptimisticSender,
} from '@app/utils/chat/message-handlers/createOptimisticUserState';
import { createMessageIdentity } from '@app/utils/chat/message-identity/createMessageIdentity';

import { createChatTimestamp } from './createChatTimestamp';

interface CreateOptimisticMessageOptions {
  badges: SanitisedBadgeSet[];
  channelName: string;
  isAction: boolean;
  messageText: string;
  replyTo?: OptimisticReplyTarget | null;
  sentAt: number;
  timestampFormat: ChatTimestampFormat;
  user?: OptimisticSender;
  userstate: ReturnType<typeof createOptimisticUserState>;
}

export function createOptimisticMessage({
  badges,
  channelName,
  isAction,
  messageText,
  replyTo,
  sentAt,
  timestampFormat,
  user,
  userstate,
}: CreateOptimisticMessageOptions): AnyChatMessageType {
  const messageId = `${sentAt}`;

  const optimisticMessage: AnyChatMessageType = {
    ...createMessageIdentity(messageId, messageId),
    userstate,
    message: [{ type: 'text', content: messageText.trimEnd() }],
    badges,
    channel: channelName,
    timestamp: createChatTimestamp(timestampFormat, sentAt),
    sender: user?.display_name || user?.login || '',
    parentDisplayName: replyTo?.username || '',
    replyParentLogin: replyTo?.login || '',
    replyBody: replyTo?.message || '',
    parentColor: replyTo?.color,
  };

  if (isAction) {
    optimisticMessage.isAction = true;
  }

  return optimisticMessage;
}
