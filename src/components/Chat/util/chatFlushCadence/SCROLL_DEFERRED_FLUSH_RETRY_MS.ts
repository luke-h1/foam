/**
 * While a drag or fling is in progress away from the bottom, publishing a
 * flush re-keys rows and forces maintainVisibleContentPosition adjustments
 * mid-gesture, dropping frames. Hold the buffer and retry once the gesture
 * settles; the buffer cap equals the store cap so nothing extra is lost.
 */
export const SCROLL_DEFERRED_FLUSH_RETRY_MS = 250;
