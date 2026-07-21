export type Resolution = { width: number; height: number };

export type Dimensions = Resolution;

export type DisplayMode = 'PORTRAIT' | 'LANDSCAPE';

export function mode(dimensions: Dimensions): DisplayMode {
  return dimensions.height >= dimensions.width ? 'PORTRAIT' : 'LANDSCAPE';
}
