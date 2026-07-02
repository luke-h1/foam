import type { TextStyle } from 'react-native';

/**
 * Interns `{ color }` text styles so hot chat spans (usernames, mentions,
 * action text) hand Fabric a stable style reference per colour instead of a
 * fresh object every render. Chat colours are a small set (Twitch's default
 * palette plus per-user customs), so the cache stays tiny; the bound is a
 * backstop against pathological custom-colour churn.
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
