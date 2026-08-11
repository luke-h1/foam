import { useSelector } from '@legendapp/state/react';

import { chatUnreadCount$ } from '../observables/chatUnreadCount';

export function useChatUnreadCount(): number {
  return useSelector(chatUnreadCount$);
}
