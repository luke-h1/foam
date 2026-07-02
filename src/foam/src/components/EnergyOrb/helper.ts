import { NAMED_COLORS } from './conf';
import type { RGB } from './types';

const parseColor = (color: string | undefined): RGB => {
  const c = (color ?? '').trim().toLowerCase();

  const named = NAMED_COLORS[c];
  if (named) {
    return named;
  }

  const hexMatch = c.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return [
      parseInt(hexMatch[1] ?? '0', 16) / 255,
      parseInt(hexMatch[2] ?? '0', 16) / 255,
      parseInt(hexMatch[3] ?? '0', 16) / 255,
    ];
  }

  const shortHexMatch = c.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    const r = shortHexMatch[1] ?? '0';
    const g = shortHexMatch[2] ?? '0';
    const b = shortHexMatch[3] ?? '0';
    return [
      parseInt(r + r, 16) / 255,
      parseInt(g + g, 16) / 255,
      parseInt(b + b, 16) / 255,
    ];
  }

  const rgbMatch = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1] ?? '0', 10) / 255,
      parseInt(rgbMatch[2] ?? '0', 10) / 255,
      parseInt(rgbMatch[3] ?? '0', 10) / 255,
    ];
  }

  return [0.1, 0.79, 0.64];
};

export { parseColor };
