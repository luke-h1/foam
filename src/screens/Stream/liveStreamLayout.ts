export type FullscreenChatMode = 'sidebar' | 'overlay';
export type LandscapeChatCycleAction = 'hide' | 'show' | 'overlay';

const DEFAULT_OVERLAY_CHAT_WIDTH = 380;
const DEFAULT_SIDEBAR_CHAT_FRACTION = 0.35;
export const LANDSCAPE_CHAT_MIN_WIDTH = 280;
const MAX_OVERLAY_CHAT_FRACTION = 0.68;
const MAX_SIDEBAR_CHAT_FRACTION = 0.55;

export function getLiveStreamLayoutMetrics({
  insetTop,
  windowHeight,
  windowWidth,
}: {
  insetTop: number;
  windowHeight: number;
  windowWidth: number;
}): {
  isLandscape: boolean;
  layoutHeight: number;
  portraitTopInset: number;
  screenHeight: number;
  screenWidth: number;
} {
  const resolvedWidth = Math.max(1, windowWidth);
  const resolvedHeight = Math.max(1, windowHeight);
  const isLandscape = resolvedWidth > resolvedHeight;
  const portraitTopInset = isLandscape ? 0 : insetTop;
  const screenHeight = resolvedHeight;
  const screenWidth = resolvedWidth;

  return {
    isLandscape,
    layoutHeight: Math.max(1, screenHeight - portraitTopInset),
    portraitTopInset,
    screenHeight,
    screenWidth,
  };
}

export function getLiveStreamChatLeft({
  chatWidth,
  isLandscape,
  screenWidth,
}: {
  chatWidth: number;
  isLandscape: boolean;
  screenWidth: number;
}): number {
  return isLandscape ? Math.max(0, screenWidth - chatWidth) : 0;
}

export function clampLandscapeChatWidth(
  width: number,
  screenWidth: number,
  mode: FullscreenChatMode,
): number {
  const minWidth = Math.min(LANDSCAPE_CHAT_MIN_WIDTH, screenWidth * 0.42);
  const maxFraction =
    mode === 'overlay' ? MAX_OVERLAY_CHAT_FRACTION : MAX_SIDEBAR_CHAT_FRACTION;
  const maxWidth = Math.max(minWidth, screenWidth * maxFraction);

  return Math.min(maxWidth, Math.max(minWidth, width));
}

export function getDefaultLandscapeChatWidth(
  mode: FullscreenChatMode,
  screenWidth: number,
): number {
  if (mode === 'overlay') {
    return Math.min(DEFAULT_OVERLAY_CHAT_WIDTH, screenWidth * 0.46);
  }

  return screenWidth * DEFAULT_SIDEBAR_CHAT_FRACTION;
}

export function getNextChatCycleAction(
  nextChatVisible: boolean,
  fullscreenChatMode: FullscreenChatMode,
): LandscapeChatCycleAction {
  if (!nextChatVisible) {
    return 'show';
  }

  return fullscreenChatMode === 'overlay' ? 'hide' : 'overlay';
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
