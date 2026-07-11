const DURATION_UNITS: [unitSeconds: number, label: string][] = [
  [86400, 'd'],
  [3600, 'h'],
  [60, 'm'],
  [1, 's'],
];

/**
 * Twitch sends timeout lengths as a raw second count. Render them as the
 * compact unit form a viewer expects (1200 -> "20m", 90 -> "1m 30s").
 */
export function formatTimeoutDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0s';
  }

  let remaining = Math.floor(totalSeconds);
  const parts: string[] = [];
  for (const [unitSeconds, label] of DURATION_UNITS) {
    if (remaining >= unitSeconds) {
      parts.push(`${Math.floor(remaining / unitSeconds)}${label}`);
      remaining %= unitSeconds;
    }
  }

  return parts.join(' ');
}
