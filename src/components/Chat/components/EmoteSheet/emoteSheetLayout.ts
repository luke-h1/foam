export const EMOTE_SHEET_DETENT = 0.78;

/**
 * Horizontal gap between emote cells in a row. Shared between the row's flex
 * `gap` style and the single-Pressable hit-testing in EmoteRow, which resolves
 * the tapped emote from its x-position — the two must use the same stride or
 * taps land on the wrong cell.
 */
export const EMOTE_CELL_GAP = 4;
