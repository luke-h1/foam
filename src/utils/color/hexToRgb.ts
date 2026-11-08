export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(char => char + char)
      .join('');
  }

  if (hex.length !== 6 || Number.isNaN(Number.parseInt(hex, 16))) {
    return null;
  }

  const bigint = Number.parseInt(hex, 16);

  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}
