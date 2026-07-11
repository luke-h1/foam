import type { FullscreenChatMode } from './types';

export type LandscapeChatCycleAction = 'hide' | 'show' | 'overlay';

export function getNextChatCycleAction(
  nextChatVisible: boolean,
  fullscreenChatMode: FullscreenChatMode,
): LandscapeChatCycleAction {
  if (!nextChatVisible) {
    return 'show';
  }

  return fullscreenChatMode === 'overlay' ? 'hide' : 'overlay';
}
