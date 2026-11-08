import { Color } from '@app/styles/palette';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import type { ChatTimestampFormat } from '@app/types/chat/chatTimestampFormat';
import {
  SYSTEM_SENDER,
  SYSTEM_SENDER_LOGIN,
} from '@app/utils/chat/isSystemSender';
import { createMessageIdentity } from '@app/utils/chat/message-identity/createMessageIdentity';
import { generateNonce } from '@app/utils/string/generateNonce';

import { createChatTimestamp } from './createChatTimestamp';

export const createSystemMessage = (
  channelName: string,
  content: string,
  timestampFormat: ChatTimestampFormat,
): AnyChatMessageType => {
  const messageId = `system-${Date.now()}`;
  const messageNonce = generateNonce();

  return {
    ...createMessageIdentity(messageId, messageNonce),
    userstate: {
      'display-name': SYSTEM_SENDER,
      login: SYSTEM_SENDER_LOGIN,
      username: SYSTEM_SENDER,
      'user-id': '',
      id: '',
      color: Color.grayscale[500],
      badges: {},
      'badges-raw': '',
      'user-type': '',
      mod: '0',
      subscriber: '0',
      turbo: '0',
      'emote-sets': '',
      'reply-parent-msg-id': '',
      'reply-parent-msg-body': '',
      'reply-parent-display-name': '',
      'reply-parent-user-login': '',
    },
    message: [{ type: 'text', content }],
    badges: [],
    channel: channelName,
    timestamp: createChatTimestamp(timestampFormat),
    sender: SYSTEM_SENDER,
    parentDisplayName: '',
    replyParentLogin: '',
    replyBody: '',
    isSpecialNotice: true,
  };
};
