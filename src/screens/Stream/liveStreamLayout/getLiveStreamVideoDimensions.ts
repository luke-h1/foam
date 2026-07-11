import { clampLandscapeChatWidth } from './clampLandscapeChatWidth';
import { getDefaultLandscapeChatWidth } from './getDefaultLandscapeChatWidth';
import type { FullscreenChatMode } from './types';

export function getLiveStreamVideoDimensions({
  fullscreenChatMode,
  isChatEnabled,
  isChatVisible,
  isLandscape,
  landscapeChatWidth,
  layoutHeight,
  isStreamEnabled,
  screenWidth,
}: {
  fullscreenChatMode: FullscreenChatMode;
  isChatEnabled: boolean;
  isChatVisible: boolean;
  isLandscape: boolean;
  landscapeChatWidth: number | null;
  layoutHeight: number;
  isStreamEnabled: boolean;
  screenWidth: number;
}): { width: number; height: number } {
  if (!isStreamEnabled) {
    return { width: 0, height: 0 };
  }

  if (isLandscape) {
    const visibleSidebarChatWidth =
      isChatEnabled && isChatVisible && fullscreenChatMode === 'sidebar'
        ? clampLandscapeChatWidth(
            landscapeChatWidth ??
              getDefaultLandscapeChatWidth('sidebar', screenWidth),
            screenWidth,
            'sidebar',
          )
        : 0;
    return {
      width: Math.max(1, screenWidth - visibleSidebarChatWidth),
      height: Math.max(1, layoutHeight),
    };
  }
  return {
    width: Math.max(1, screenWidth),
    height: Math.max(1, screenWidth * (9 / 16)),
  };
}
