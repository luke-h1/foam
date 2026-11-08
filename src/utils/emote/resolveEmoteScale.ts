import type { EmoteImageScale } from '@app/types/emote';

/**
 * Picker grid cells render at ~40pt; 2x keeps the sheet from decoding hundreds
 * of 4x animated AVIFs at once (see issue #594).
 */
export const EMOTE_PICKER_SCALE: EmoteImageScale = '2x';
