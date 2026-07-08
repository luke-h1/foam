import type { EmoteImageScale } from '@app/types/emote';

export const CHAT_INLINE_EMOTE_SCALE: EmoteImageScale = '1x';

/**
 * Picker grid cells render at ~40pt; 2x keeps the sheet from decoding hundreds
 * of 4x animated AVIFs at once (see issue #594).
 */
export const EMOTE_PICKER_SCALE: EmoteImageScale = '2x';
