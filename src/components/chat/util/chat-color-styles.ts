import type { TextStyle } from 'react-native';

/**
 * Interns `{ color }` text styles so hot chat spans hand Fabric a stable style
 * reference per colour instead of a fresh object every render.
 */
const colorStyles = new Map<string, TextStyle>();

const MAX_COLOR_STYLES = 512;

export function getChatColorStyle(color: string): TextStyle {
  const cached = colorStyles.get(color);

  if (cached) {
    return cached;
  }

  // Colours are unbounded (7TV paints, Twitch hex), so drop the whole map
  // rather than track ages for what is only a style-object cache.
  if (colorStyles.size >= MAX_COLOR_STYLES) {
    colorStyles.clear();
  }

  const style: TextStyle = { color };
  colorStyles.set(color, style);
  return style;
}
