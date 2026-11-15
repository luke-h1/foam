let nonceCounter = 0;

export function generateNonce(): string {
  nonceCounter = (nonceCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now().toString()}-${nonceCounter.toString(36)}`;
}
