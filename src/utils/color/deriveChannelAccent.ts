import type { ColorScheme } from '@app/styles/themes';

/**
 * A stable, scheme-tuned accent derived from a channel seed. `colors` is a
 * three-stop gradient (light to deep), `glow` an outer-glow tint, `base` a
 * solid representative colour, and `text` the readable ink to lay over it.
 */
export interface ChannelAccent {
  colors: [string, string, string];
  glow: string;
  base: string;
  text: string;
}

/**
 * The three gradient stops as [hueOffset, saturation, lightness]. Offsets are
 * small enough to stay recognisably one colour, wide enough to read as a
 * gradient; the ramp darkens from top to deep.
 */
const STOPS: readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
] = [
  [0, 0.72, 0.62],
  [34, 0.68, 0.5],
  [80, 0.64, 0.4],
];

/**
 * Above this perceived luminance the orb is light enough that dark ink reads
 * better than white.
 */
const DARK_INK_LUMINANCE = 0.6;
const DARK_INK = '#0F1620';

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Rec. 601 luma, good enough to pick between light and dark ink.
 */
function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Light mode wants airy pastels that sit calmly on the white card surface;
 * dark mode wants richer, brighter tones that glow against near-black.
 */
function tuneForScheme(
  saturation: number,
  lightness: number,
  scheme: ColorScheme,
): { s: number; l: number } {
  if (scheme === 'dark') {
    return { s: clamp01(saturation * 1.18), l: clamp01(lightness + 0.04) };
  }
  return { s: clamp01(saturation * 0.7), l: clamp01(lightness + 0.16) };
}

/**
 * Derives a deterministic accent palette for a channel from any stable seed
 * (use `user_login`), tuned for the active colour scheme. The same seed and
 * scheme always yield the same palette, so a channel keeps its colour across
 * renders and sessions without any stored state.
 */
export function deriveChannelAccent(
  seed: string,
  scheme: ColorScheme,
): ChannelAccent {
  const hue = hashString(seed.trim().toLowerCase()) % 360;

  const stopAt = (stop: readonly [number, number, number]) => {
    const [offset, saturation, lightness] = stop;
    const tuned = tuneForScheme(saturation, lightness, scheme);
    const { r, g, b } = hslToRgb((hue + offset) % 360, tuned.s, tuned.l);
    return { hex: toHex(r, g, b), r, g, b };
  };

  const top = stopAt(STOPS[0]);
  const mid = stopAt(STOPS[1]);
  const deep = stopAt(STOPS[2]);
  const text =
    luminance(mid.r, mid.g, mid.b) > DARK_INK_LUMINANCE ? DARK_INK : '#FFFFFF';

  return {
    colors: [top.hex, mid.hex, deep.hex],
    glow: top.hex,
    base: mid.hex,
    text,
  };
}
