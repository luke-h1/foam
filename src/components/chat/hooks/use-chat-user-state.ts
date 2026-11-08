import { useSyncExternalStore } from 'react';

import {
  getChatUserState,
  subscribeChatUserState,
} from '../util/chat-user-state';

export function useChatUserState(): Record<string, string> {
  return useSyncExternalStore(subscribeChatUserState, getChatUserState);
}
