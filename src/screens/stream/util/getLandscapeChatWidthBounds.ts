import { LANDSCAPE_CHAT_MIN_WIDTH } from '../constants';
import type { FullscreenChatMode } from '../types';

const MAX_OVERLAY_CHAT_FRACTION = 0.68;
const MAX_SIDEBAR_CHAT_FRACTION = 0.55;

type LandscapeChatWidthBounds = { minWidth: number; maxWidth: number };

export function getLandscapeChatWidthBounds(
  screenWidth: number,
  mode: FullscreenChatMode,
): LandscapeChatWidthBounds {
  'worklet';

  const minWidth = Math.min(LANDSCAPE_CHAT_MIN_WIDTH, screenWidth * 0.42);

  const maxFraction =
    mode === 'overlay' ? MAX_OVERLAY_CHAT_FRACTION : MAX_SIDEBAR_CHAT_FRACTION;

  const maxWidth = Math.max(minWidth, screenWidth * maxFraction);

  return { maxWidth, minWidth };
}
