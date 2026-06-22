import { useSyncExternalStore } from 'react';
import { chatScrollActivity } from './chatScrollActivity';

/**
 * Subscribe a component to the global chat scroll-activity signal, re-rendering
 * it when a fling starts and when it settles (~150ms quiet window). Used to shed
 * expensive offscreen render work — e.g. painted-username MaskedViews — during
 * scroll, the moment the Core Animation render encoder is most pressured.
 */
export function useChatScrollActive(): boolean {
  return useSyncExternalStore(
    chatScrollActivity.subscribe,
    chatScrollActivity.isActive,
    () => false,
  );
}
