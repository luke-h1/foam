export function encodeEmoji(unified: string): string {
  return String.fromCodePoint(
    ...unified.split('-').map(code => parseInt(code, 16)),
  );
}
