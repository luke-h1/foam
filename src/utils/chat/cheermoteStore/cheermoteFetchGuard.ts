import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';

/**
 * Session cache; cheermote sets change rarely, so a fetch per channel per
 * session (refreshed after the TTL) is plenty.
 */
const CHEERMOTE_TTL_MS = 30 * 60 * 1000;

export const cheermoteFetchGuard = createFetchOnceGuard({
  ttlMs: CHEERMOTE_TTL_MS,
});
