import type { TextStyle } from 'react-native';

const colorStyles = new Map<string, TextStyle>();

const MAX_COLOR_STYLES = 512;

export function getChatColorStyle(color: string): TextStyle {
  const cached = colorStyles.get(color);

  if (cached) {
    return cached;
  }

  if (colorStyles.size >= MAX_COLOR_STYLES) {
    colorStyles.clear();
  }

  const style: TextStyle = { color };
  colorStyles.set(color, style);
  return style;
}
