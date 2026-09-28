import { useSelector } from '@legendapp/state/react';

import { chatUnreadCount$ } from '../observables/chat-unread-count';

export function useChatUnreadCount(): number {
  return useSelector(chatUnreadCount$);
}
