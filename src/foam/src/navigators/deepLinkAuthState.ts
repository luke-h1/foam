let inProgressCount = 0;

export function beginDeepLinkAuth(): void {
  inProgressCount += 1;
}

export function endDeepLinkAuth(): void {
  inProgressCount = Math.max(0, inProgressCount - 1);
}

export function isDeepLinkAuthInProgress(): boolean {
  return inProgressCount > 0;
}
