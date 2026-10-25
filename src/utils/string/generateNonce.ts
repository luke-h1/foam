let nonceCounter = 0;

/**
 * The counter suffix keeps same-millisecond nonces unique; a random suffix
 * could collide and message dedupe would silently drop a message.
 */
export function generateNonce(): string {
  nonceCounter = (nonceCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now().toString()}-${nonceCounter.toString(36)}`;
}
