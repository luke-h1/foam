let sessionHadError = false;

export function markSessionError(): void {
  sessionHadError = true;
}

export function hasSessionError(): boolean {
  return sessionHadError;
}
