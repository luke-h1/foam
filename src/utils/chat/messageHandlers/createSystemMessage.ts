import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { Color } from '@app/styles/pallete';
import { generateNonce } from '@app/utils/string/generateNonce';

import { createChatTimestamp } from './createChatTimestamp';

export const createSystemMessage = (
  channelName: string,
  content: string,
): AnyChatMessageType => {
  const messageId = `system-${Date.now()}`;
  const messageNonce = generateNonce();

  return {
    id: `${messageId}_${messageNonce}`,
    userstate: {
      'display-name': 'System',
      login: 'system',
      username: 'System',
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
    message_id: messageId,
    message_nonce: messageNonce,
    timestamp: createChatTimestamp(),
    sender: 'System',
    parentDisplayName: '',
    replyDisplayName: '',
    replyBody: '',
    parentColor: undefined,
    isSpecialNotice: true,
  };
};
