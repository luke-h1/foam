export type ErrorCategory = 'network' | 'blocked' | 'bad-response' | 'crash';

const NETWORK_PATTERNS = [
  /network request failed/i,
  /failed to fetch/i,
  /timed? ?out/i,
  /socket/i,
  /econnrefused|enotfound|etimedout|econnreset/i,
];

const BLOCKED_PATTERNS = [/\bHTTP 403\b/];

const BAD_RESPONSE_PATTERNS = [
  /JSON Parse error/i,
  /Unexpected (token|character|end of JSON)/i,
];

export function categorizeError(error: Error | null): ErrorCategory {
  const message = error?.message ?? '';

  if (NETWORK_PATTERNS.some(pattern => pattern.test(message))) {
    return 'network';
  }

  if (BLOCKED_PATTERNS.some(pattern => pattern.test(message))) {
    return 'blocked';
  }

  if (BAD_RESPONSE_PATTERNS.some(pattern => pattern.test(message))) {
    return 'bad-response';
  }

  return 'crash';
}

export function getErrorTitle(category: ErrorCategory): string {
  switch (category) {
    case 'network':
      return 'Connection trouble';
    case 'blocked':
      return 'Access blocked';
    case 'bad-response':
      return 'Unexpected response';
    case 'crash':
      return 'Something went wrong';
  }
}

export function getFriendlyErrorMessage(category: ErrorCategory): string {
  switch (category) {
    case 'network':
      return 'Foam could not reach Twitch. Check your connection, then try again.';
    case 'blocked':
      return 'Your network blocked Foam from signing in. Try another network or turn off your VPN, then try again.';
    case 'bad-response':
      return 'A service sent Foam a response it could not read. Try again in a few minutes.';
    case 'crash':
      return 'Reset or restart the app. If the problem continues, send feedback.';
  }
}
