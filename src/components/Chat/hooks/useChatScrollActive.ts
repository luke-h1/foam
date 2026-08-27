import { useSyncExternalStore } from 'react';

import { chatScrollActivity } from '@app/components/Chat/util/chatScrollActivity';

/**
 * Subscribes to the global chat scroll-activity signal (fling start, ~150ms
 * settle window), used to shed expensive render work during scroll.
 */
export function useChatScrollActive(): boolean {
  return useSyncExternalStore(
    chatScrollActivity.subscribe,
    chatScrollActivity.isActive,
    () => false,
  );
}
