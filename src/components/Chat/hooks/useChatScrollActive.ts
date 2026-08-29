import { useSyncExternalStore } from 'react';

import { chatScrollActivity } from '@app/components/Chat/util/chatScrollActivity';

export function useChatScrollActive(): boolean {
  return useSyncExternalStore(
    chatScrollActivity.subscribe,
    chatScrollActivity.isActive,
    () => false,
  );
}
