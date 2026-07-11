import { getLandscapeChatWidthBounds } from './getLandscapeChatWidthBounds';
import type { FullscreenChatMode } from './types';

export function clampLandscapeChatWidth(
  width: number,
  screenWidth: number,
  mode: FullscreenChatMode,
): number {
  const { maxWidth, minWidth } = getLandscapeChatWidthBounds(screenWidth, mode);

  return Math.min(maxWidth, Math.max(minWidth, width));
}
