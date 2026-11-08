import { useMemo } from 'react';

import type { FullscreenChatMode } from '../types';
import { getLiveStreamChatDimensions } from '../util/getLiveStreamChatDimensions';
import { getLiveStreamVideoDimensions } from '../util/getLiveStreamVideoDimensions';

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

  const isLandscapeChatHidden = !isChatVisibleForLayout && isLandscape;

  return {
    chatDimensions,
    effectiveChatHeight: isLandscapeChatHidden ? 0 : chatDimensions.height,
    effectiveChatWidth: isLandscapeChatHidden ? 0 : chatDimensions.width,
    isLandscapeChatHidden,
    videoDimensions,
  };
}
