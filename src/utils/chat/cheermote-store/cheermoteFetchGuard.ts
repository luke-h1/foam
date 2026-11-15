import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';

const CHEERMOTE_TTL_MS = 30 * 60 * 1000;

export const cheermoteFetchGuard = createFetchOnceGuard({
  ttlMs: CHEERMOTE_TTL_MS,
});
