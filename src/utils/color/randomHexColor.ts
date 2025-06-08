/**
 * Generates a random hex color code.
 *
 * The function creates a random number, converts it to a hexadecimal string,
 * and ensures it is always 6 characters long by padding with leading zeros if necessary.
 *
 * @returns {string} A random hex color code in the format `#RRGGBB`.
 *
 * @example
 * const color = randomHexColor();
 * console.log(color); // e.g., "#1a2b3c"
 */
export function randomHexColor(): string {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
}
