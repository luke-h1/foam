import type { TextStyle } from 'react-native';

/**
 * Interns `{ color }` text styles so hot chat spans hand Fabric a stable style
 * reference per colour instead of a fresh object every render.
 */
const colorStyles = new Map<string, TextStyle>();
const MAX_COLOR_STYLES = 512;

export function getChatColorStyle(color: string): TextStyle {
  let style = colorStyles.get(color);
  if (!style) {
    if (colorStyles.size >= MAX_COLOR_STYLES) {
      colorStyles.clear();
    }
    style = { color };
    colorStyles.set(color, style);
  }
  return style;
}
