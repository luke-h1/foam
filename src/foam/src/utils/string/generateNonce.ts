/**
 * Generates a unique nonce (number used once).
 *
 * @returns {string} A unique nonce as a string.
 *
 * @example
 * const nonce = generateNonce();
 * console.log(nonce); // e.g., "1681234567890123"
 */
export function generateNonce(): string {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}
