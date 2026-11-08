import type { ChatMessageType } from '@app/types/chat/chatMessage';
import type { ChatTimestampFormat } from '@app/types/chat/chatTimestampFormat';
import { isHighlightMyMessageTags } from '@app/utils/chat/channel-points-reward-title/isHighlightMyMessageTags';
import { createMessageIdentity } from '@app/utils/chat/message-identity/createMessageIdentity';
import { generateNonce } from '@app/utils/string/generateNonce';

import { createChatTimestampFromTags } from './createChatTimestampFromTags';
import { createUserStateFromTags } from './createUserStateFromTags';
import { getReplyFields } from './getReplyFields';

interface CreateBaseMessageParams {
  tags: Record<string, string>;
  channelName: string;
  text: string;
  isAction?: boolean;
  timestampFormat: ChatTimestampFormat;
}

export const createBaseMessage = ({
  tags,
  channelName,
  text,
  isAction,
  timestampFormat,
}: CreateBaseMessageParams): ChatMessageType<'usernotice'> => {
  const userstate = createUserStateFromTags(tags);
  const messageId = userstate.id || '0';
  const messageNonce = messageId !== '0' ? messageId : generateNonce();
  const isHighlightedMessage = isHighlightMyMessageTags(tags);

  const message: ChatMessageType<'usernotice'> = {
    ...createMessageIdentity(messageId, messageNonce),
    userstate,
    message: [{ type: 'text', content: text.trimEnd() }],
    badges: [],
    channel: channelName,
    timestamp: createChatTimestampFromTags(tags, timestampFormat),
    sender: userstate.username || '',
    ...getReplyFields(tags),
    isChannelPointRedemption:
      Boolean(tags['custom-reward-id']) || isHighlightedMessage,
  };

  if (isHighlightedMessage) {
    message.isHighlightedMessage = true;
  }

  if (isAction) {
    message.isAction = true;
  }

  return message;
};
