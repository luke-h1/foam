import { SevenTvColor } from '@app/types/seventv/cosmetics';

export type SevenTvRgba = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export function sevenTvColorToRgba(color: SevenTvColor): SevenTvRgba {
  // eslint-disable-next-line no-bitwise
  const r = (color >>> 24) & 0xff;
  // eslint-disable-next-line no-bitwise
  const g = (color >>> 16) & 0xff;
  // eslint-disable-next-line no-bitwise
  const b = (color >>> 8) & 0xff;
  // eslint-disable-next-line no-bitwise
  const a = color & 0xff;

  return { r, g, b, a };
}
