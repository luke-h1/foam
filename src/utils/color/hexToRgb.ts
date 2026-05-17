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

  if (hex.length !== 6 || Number.isNaN(parseInt(hex, 16))) {
    return null;
  }

  const bigint = parseInt(hex, 16);
  return {
    // eslint-disable-next-line no-bitwise
    r: (bigint >> 16) & 255,
    // eslint-disable-next-line no-bitwise
    g: (bigint >> 8) & 255,
    // eslint-disable-next-line no-bitwise
    b: bigint & 255,
  };
}
