import { hexToRgb } from './hexToRgb';
import { rgbToHex } from './rgbToHex';

// Chat renders on a near-black surface; anything below this HSL lightness
// reads as illegible mud (e.g. Twitch default dark blue/red usernames).
const MIN_LIGHTNESS = 0.55;

export function lightenColor(hex: string): string {
  hex = rgbToHex(hex);

  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return hex;
  }

  const rgb = hexToRgb(hex);

  if (!rgb) {
    return hex;
  }

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  if (l >= MIN_LIGHTNESS) {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  const { r, g, b } = hslToRgb(h, s, MIN_LIGHTNESS);
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === rn) {
    h = (gn - bn) / d + (gn < bn ? 6 : 0);
  } else if (max === gn) {
    h = (bn - rn) / d + 2;
  } else {
    h = (rn - gn) / d + 4;
  }

  return { h: h / 6, s, l };
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  if (s === 0) {
    const value = Math.round(l * 255);
    return { r: value, g: value, b: value };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hueToChannel(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToChannel(p, q, h) * 255),
    b: Math.round(hueToChannel(p, q, h - 1 / 3) * 255),
  };
}

function hueToChannel(p: number, q: number, t: number): number {
  let tn = t;
  if (tn < 0) {
    tn += 1;
  }
  if (tn > 1) {
    tn -= 1;
  }
  if (tn < 1 / 6) {
    return p + (q - p) * 6 * tn;
  }
  if (tn < 1 / 2) {
    return q;
  }
  if (tn < 2 / 3) {
    return p + (q - p) * (2 / 3 - tn) * 6;
  }
  return p;
}
