export function decodeEmoji(emoji: string): string {
  return [...emoji]
    .map(char => char.codePointAt(0)?.toString(16).toUpperCase() || '')
    .join('-');
}
