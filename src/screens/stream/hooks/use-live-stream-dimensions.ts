import { useMemo } from 'react';

import type { FullscreenChatMode } from '../types';
import { getLiveStreamChatDimensions } from '../util/get-live-stream-chat-dimensions';
import { getLiveStreamVideoDimensions } from '../util/get-live-stream-video-dimensions';

type LiveStreamDimensionsInput = {
  contentWidth: number;
  fullscreenChatMode: FullscreenChatMode;
  isChatEnabled: boolean;
  isChatVisible: boolean;
  isChatVisibleForLayout: boolean;
  isLandscape: boolean;
  isStreamEnabled: boolean;
  landscapeChatWidth: number | null;
  layoutHeight: number;
};

/**
 * Sizes the video and chat panes for the current orientation and chat mode.
 * Memoised so the resize animation re-runs only when a dimension changes, not
 * on every render of the screen.
 */
export function useLiveStreamDimensions({
  contentWidth,
  fullscreenChatMode,
  isChatEnabled,
  isChatVisible,
  isChatVisibleForLayout,
  isLandscape,
  isStreamEnabled,
  landscapeChatWidth,
  layoutHeight,
}: LiveStreamDimensionsInput) {
  const videoDimensions = useMemo(
    () =>
      getLiveStreamVideoDimensions({
        fullscreenChatMode,
        isChatEnabled,
        isChatVisible,
        isLandscape,
        landscapeChatWidth,
        layoutHeight,
        isStreamEnabled,
        screenWidth: contentWidth,
      }),
    [
      fullscreenChatMode,
      isChatEnabled,
      isChatVisible,
      isLandscape,
      landscapeChatWidth,
      layoutHeight,
      isStreamEnabled,
      contentWidth,
    ],
  );

  const chatDimensions = useMemo(
    () =>
      getLiveStreamChatDimensions({
        fullscreenChatMode,
        isChatEnabled,
        isLandscape,
        landscapeChatWidth,
        layoutHeight,
        isStreamEnabled,
        screenWidth: contentWidth,
      }),
    [
      fullscreenChatMode,
      isChatEnabled,
      isLandscape,
      landscapeChatWidth,
      layoutHeight,
      isStreamEnabled,
      contentWidth,
    ],
  );

  // Landscape hides chat by collapsing it to zero rather than unmounting it.
  const isLandscapeChatHidden = !isChatVisibleForLayout && isLandscape;

  return {
    chatDimensions,
    effectiveChatHeight: isLandscapeChatHidden ? 0 : chatDimensions.height,
    effectiveChatWidth: isLandscapeChatHidden ? 0 : chatDimensions.width,
    isLandscapeChatHidden,
    videoDimensions,
  };
}
