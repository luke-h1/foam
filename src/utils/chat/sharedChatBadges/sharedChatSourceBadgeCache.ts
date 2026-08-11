import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import type { TimedCacheEntry } from './types';

export const sharedChatSourceBadgeCache = new Map<
  string,
  TimedCacheEntry<SanitisedBadgeSet | null>
>();
