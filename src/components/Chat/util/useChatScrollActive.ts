import { useSyncExternalStore } from 'react';

import { chatScrollActivity } from './chatScrollActivity';

/**
 * Subscribe a component to the global chat scroll-activity signal, re-rendering
 * it when the list starts and stops scrolling (~150ms quiet window).
 */
export function useChatScrollActive(): boolean {
  return useSyncExternalStore(
    chatScrollActivity.subscribe,
    chatScrollActivity.isActive,
    () => false,
  );
}
