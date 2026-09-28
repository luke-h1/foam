import { useSyncExternalStore } from 'react';

import { chatScrollActivity } from '@app/components/chat/util/chat-scroll-activity';

export function useChatScrollActive(): boolean {
  return useSyncExternalStore(
    chatScrollActivity.subscribe,
    chatScrollActivity.isActive,
    () => false,
  );
}
