/**
 * Tracks whether the current app session recorded an error, so the
 * store-review prompt gate never asks for a rating in a bad session.
 * Module state on purpose: resets on every cold start.
 */
let sessionHadError = false;

export function markSessionError(): void {
  sessionHadError = true;
}

export function hasSessionError(): boolean {
  return sessionHadError;
}
