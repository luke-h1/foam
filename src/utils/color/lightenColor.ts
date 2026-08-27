import { hexToRgb } from './hexToRgb';
import { rgbToHex } from './rgbToHex';

type RgbChannels = {
  r: number;
  g: number;
  b: number;
};

type HslChannels = {
  h: number;
  s: number;
  l: number;
};

/**
 * The composited chat row surface; colours are corrected against this real
 * background because a lightness floor says nothing about legibility.
 */
const CHAT_SURFACE_RGB = { r: 20, g: 27, b: 35 };

// WCAG AA for normal-size text; higher washes the hues together.
const MIN_CONTRAST_RATIO = 4.5;

const CONTRAST_SEARCH_STEPS = 16;

export function lightenColor(hex: string): string {
  hex = rgbToHex(hex);

  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return hex;
  }

  const rgb = hexToRgb(hex);

  if (!rgb) {
    return hex;
  }

  if (contrastRatio(rgb, CHAT_SURFACE_RGB) >= MIN_CONTRAST_RATIO) {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Lowest lightness that clears the target, so a colour keeps its identity.
  let low = l;
  let high = 1;
  let best = hslToRgb(h, s, 1);

  for (let step = 0; step < CONTRAST_SEARCH_STEPS; step += 1) {
    const mid = (low + high) / 2;
    const candidate = hslToRgb(h, s, mid);

    if (contrastRatio(candidate, CHAT_SURFACE_RGB) >= MIN_CONTRAST_RATIO) {
      best = candidate;
      high = mid;
    } else {
      low = mid;
    }
  }

  return `rgb(${best.r}, ${best.g}, ${best.b})`;
}

function relativeLuminance({ r, g, b }: RgbChannels): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928
      ? scaled / 12.92
      : ((scaled + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: RgbChannels, b: RgbChannels): number {
  const luminanceA = relativeLuminance(a);
  const luminanceB = relativeLuminance(b);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);

  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHsl(r: number, g: number, b: number): HslChannels {
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

function hslToRgb(h: number, s: number, l: number): RgbChannels {
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
