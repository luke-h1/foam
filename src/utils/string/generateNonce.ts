let nonceCounter = 0;

/**
 * Counter suffix keeps nonces unique within a session even when several are
 * minted in the same millisecond — a random suffix could collide and message
 * dedupe would silently drop one of the colliding messages.
 */
export function generateNonce(): string {
  nonceCounter = (nonceCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now().toString()}-${nonceCounter.toString(36)}`;
}
