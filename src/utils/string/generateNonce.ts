let nonceCounter = 0;

/**
 * Generates a unique nonce (number used once). The counter suffix keeps
 * nonces unique within a session even when several are minted in the same
 * millisecond, where the previous random suffix could collide and message
 * dedupe would silently drop one of the colliding messages.
 *
 * @returns {string} A unique nonce as a string.
 *
 * @example
 * const nonce = generateNonce();
 * console.log(nonce); // e.g., "1681234567890-1a"
 */
export function generateNonce(): string {
  nonceCounter = (nonceCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now().toString()}-${nonceCounter.toString(36)}`;
}
