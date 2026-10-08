export type ErrorCategory = 'network' | 'crash';

const NETWORK_PATTERNS = [
  /network request failed/i,
  /failed to fetch/i,
  /timed? ?out/i,
  /socket/i,
  /econnrefused|enotfound|etimedout|econnreset/i,
];

export function categorizeError(error: Error | null): ErrorCategory {
  const message = error?.message ?? '';
  return NETWORK_PATTERNS.some(pattern => pattern.test(message))
    ? 'network'
    : 'crash';
}

export function getFriendlyErrorMessage(category: ErrorCategory): string {
  switch (category) {
    case 'network':
      return 'Foam could not reach Twitch. Check your connection, then try again.';
    case 'crash':
      return 'Reset or restart the app. If the problem continues, send feedback.';
  }
}
