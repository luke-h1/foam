export const PAINT_FONT_FAMILY = 'Montserrat';

/**
 * 7TV stores `textStyle.weight` as the CSS font weight divided by 100 (1-9).
 */
export function paintCssFontWeight(weight: number): number {
  return weight * 100;
}
