import { Resolution } from '@app/hooks/useScale';

export type Dimensions = Resolution;

export type DisplayMode = 'PORTRAIT' | 'LANDSCAPE';

/**
 * Helper function - check for effective window mode (based on window proportions)
 *
 * @param dimensions - screen dimensions
 * @returns Either PORTRAIT or LANDSCAPE mode
 */
export function mode(dimensions: Dimensions): DisplayMode {
  return dimensions.height >= dimensions.width ? 'PORTRAIT' : 'LANDSCAPE';
}
