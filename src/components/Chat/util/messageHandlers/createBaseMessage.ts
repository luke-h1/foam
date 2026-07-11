import type { ChatMessageType } from '@app/store/chat/types/constants';
import { enrichChannelPointPrivmsgTags } from '@app/utils/chat/channelPointRewardTitleStore';
import { isHighlightMyMessageTags } from '@app/utils/chat/channelPointsRewardTitle/isHighlightMyMessageTags';
import { generateNonce } from '@app/utils/string/generateNonce';

import { createChatTimestampFromTags } from './createChatTimestampFromTags';
import { createUserStateFromTags } from './createUserStateFromTags';

interface CreateBaseMessageParams {
  tags: Record<string, string>;
  channelName: string;
  text: string;
  broadcasterId?: string;
  isAction?: boolean;
}

export const createBaseMessage = ({
  tags,
  channelName,
  text,
  broadcasterId,
  isAction,
}: CreateBaseMessageParams): ChatMessageType<'usernotice'> => {
  const enrichedTags = enrichChannelPointPrivmsgTags(tags, broadcasterId);
  const userstate = createUserStateFromTags(enrichedTags);
  const messageId = userstate.id || '0';
  const messageNonce = messageId !== '0' ? messageId : generateNonce();
  const isHighlightedMessage = isHighlightMyMessageTags(enrichedTags);

  return {
    id: `${messageId}_${messageNonce}`,
    userstate,
    message: [{ type: 'text', content: text.trimEnd() }],
    badges: [],
    channel: channelName,
    message_id: messageId,
    message_nonce: messageNonce,
    timestamp: createChatTimestampFromTags(tags),
    sender: userstate.username || '',
    parentDisplayName: tags['reply-parent-display-name'] || '',
    replyDisplayName: tags['reply-parent-user-login'] || '',
    replyBody: tags['reply-parent-msg-body'] || '',
    parentColor: undefined,
    isChannelPointRedemption:
      Boolean(enrichedTags['custom-reward-id']) || isHighlightedMessage,
    ...(isHighlightedMessage ? { isHighlightedMessage: true } : {}),
    ...(isAction ? { isAction: true } : {}),
  };
};
