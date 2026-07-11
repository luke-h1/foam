import type { AnyChatMessageType } from '@app/store/chat/types/constants';

export function shouldReprocessMessage(msg: AnyChatMessageType): boolean {
  if (msg.sender === 'System') {
    return false;
  }

  if (
    'notice_tags' in msg &&
    msg.notice_tags &&
    !msg.isAnnouncement &&
    !msg.isHighlightedMessage
  ) {
    return false;
  }

  return true;
}
