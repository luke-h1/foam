import type { FullscreenChatMode } from './types';

const DEFAULT_OVERLAY_CHAT_WIDTH = 380;
const DEFAULT_SIDEBAR_CHAT_FRACTION = 0.35;

export function getDefaultLandscapeChatWidth(
  mode: FullscreenChatMode,
  screenWidth: number,
): number {
  if (mode === 'overlay') {
    return Math.min(DEFAULT_OVERLAY_CHAT_WIDTH, screenWidth * 0.46);
  }

  return screenWidth * DEFAULT_SIDEBAR_CHAT_FRACTION;
}
