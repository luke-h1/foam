import type { FullscreenChatMode } from '../types';
import { clampLandscapeChatWidth } from './clamp-landscape-chat-width';
import { getDefaultLandscapeChatWidth } from './get-default-landscape-chat-width';

export type LiveStreamVideoDimensions = {
  width: number;
  height: number;
};

interface GetLiveStreamVideoDimensionsOptions {
  fullscreenChatMode: FullscreenChatMode;
  isChatEnabled: boolean;
  isChatVisible: boolean;
  isLandscape: boolean;
  landscapeChatWidth: number | null;
  layoutHeight: number;
  isStreamEnabled: boolean;
  screenWidth: number;
}

export function getLiveStreamVideoDimensions({
  fullscreenChatMode,
  isChatEnabled,
  isChatVisible,
  isLandscape,
  landscapeChatWidth,
  layoutHeight,
  isStreamEnabled,
  screenWidth,
}: GetLiveStreamVideoDimensionsOptions): LiveStreamVideoDimensions {
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
