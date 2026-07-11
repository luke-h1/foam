import { LANDSCAPE_CHAT_MIN_WIDTH } from './LANDSCAPE_CHAT_MIN_WIDTH';
import type { FullscreenChatMode } from './types';

const MAX_OVERLAY_CHAT_FRACTION = 0.68;
const MAX_SIDEBAR_CHAT_FRACTION = 0.55;

export function getLandscapeChatWidthBounds(
  screenWidth: number,
  mode: FullscreenChatMode,
): { minWidth: number; maxWidth: number } {
  'worklet';

  const minWidth = Math.min(LANDSCAPE_CHAT_MIN_WIDTH, screenWidth * 0.42);
  const maxFraction =
    mode === 'overlay' ? MAX_OVERLAY_CHAT_FRACTION : MAX_SIDEBAR_CHAT_FRACTION;
  const maxWidth = Math.max(minWidth, screenWidth * maxFraction);

  return { maxWidth, minWidth };
}
