/**
 * Helix gives a start time and a length in seconds, not an end time, for a
 * running poll or prediction.
 */
export function addSecondsToIso(iso: string, seconds: number): string {
  return new Date(Date.parse(iso) + seconds * 1000).toISOString();
}
