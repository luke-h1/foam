/**
 * Tracks whether this session recorded an error so the store-review gate never
 * asks for a rating in a bad session; module state resets on cold start.
 */
let sessionHadError = false;

export function markSessionError(): void {
  sessionHadError = true;
}

export function hasSessionError(): boolean {
  return sessionHadError;
}
