import { clampLandscapeChatWidth } from './clampLandscapeChatWidth';
import { getDefaultLandscapeChatWidth } from './getDefaultLandscapeChatWidth';
import type { FullscreenChatMode } from './types';

export function getLiveStreamChatDimensions({
  fullscreenChatMode,
  isChatEnabled,
  isLandscape,
  landscapeChatWidth,
  layoutHeight,
  isStreamEnabled,
  screenWidth,
}: {
  fullscreenChatMode: FullscreenChatMode;
  isChatEnabled: boolean;
  isLandscape: boolean;
  landscapeChatWidth: number | null;
  layoutHeight: number;
  isStreamEnabled: boolean;
  screenWidth: number;
}): { width: number; height: number } {
  if (!isChatEnabled) {
    return { width: 0, height: 0 };
  }

  if (!isStreamEnabled) {
    return {
      width: Math.max(1, screenWidth),
      height: Math.max(1, layoutHeight),
    };
  }

  if (isLandscape) {
    return {
      width: clampLandscapeChatWidth(
        landscapeChatWidth ??
          getDefaultLandscapeChatWidth(fullscreenChatMode, screenWidth),
        screenWidth,
        fullscreenChatMode,
      ),
      height: Math.max(1, layoutHeight),
    };
  }

  const videoHeight = screenWidth * (9 / 16);
  return {
    width: Math.max(1, screenWidth),
    height: Math.max(1, layoutHeight - videoHeight),
  };
}
