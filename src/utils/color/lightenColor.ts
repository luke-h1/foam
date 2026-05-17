import { hexToRgb } from './hexToRgb';
import { isSingleChannel } from './isSingleChannel';
import { rgbToHex } from './rgbToHex';

export function lightenColor(hex: string): string {
  const min = 60;

  hex = rgbToHex(hex);

  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return hex;
  }

  const rgb = hexToRgb(hex);

  if (!rgb) {
    return hex;
  }

  let { r, g, b } = rgb;

  if (isSingleChannel(r, g, b)) {
    if (r > 0) {
      r = 255;
    }
    if (g > 0) {
      g = 255;
    }
    if (b > 0) {
      b = 230;
    }
  } else {
    if (r <= min) {
      r = min + 1;
    }
    if (g <= min) {
      g = min + 1;
    }
    if (b <= min) {
      b = min + 1;
    }
  }

  return `rgb(${r}, ${g}, ${b})`;
}
