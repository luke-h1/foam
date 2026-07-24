import Signpost from '@modules/signpost/src/SignpostModule';

/**
 * Instant Points of Interest marker for Instruments.
 */
export function markSignpost(name: string): void {
  Signpost.mark(name);
}

/**
 * Begin a named interval; pair with `endSignpost(name)`.
 */
export function beginSignpost(name: string): void {
  Signpost.begin(name);
}

/**
 * End a previously begun interval.
 */
export function endSignpost(name: string): void {
  Signpost.end(name);
}
