import { hexToRgb } from './hexToRgb';
import { isSingleChannel } from './isSingleChannel';
import { rgbToHex } from './rgbToHex';

export function lightenColor(hex: string): string {
  const min = 60;

  // Convert to hex format if it's in RGB format
  // eslint-disable-next-line no-param-reassign
  hex = rgbToHex(hex);

  // Validate the hex color format
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return hex; // Return the original input if invalid
  }

  const rgb = hexToRgb(hex);

  // Ensure `hexToRgb` returned a valid object
  if (!rgb) {
    return hex; // Return the original input if conversion fails
  }

  let { r, g, b } = rgb;

  // Check if the color is a single channel
  if (isSingleChannel(r, g, b)) {
    if (r > 0) r = 255;
    if (g > 0) g = 255;
    if (b > 0) b = 230;
  } else {
    // Ensure each channel is above the minimum threshold
    if (r <= min) r = min + 1;
    if (g <= min) g = min + 1;
    if (b <= min) b = min + 1;
  }

  return `rgb(${r}, ${g}, ${b})`;
}
