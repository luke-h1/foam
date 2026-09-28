import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import type { TimedCacheEntry } from './types';

export const sharedChatChannelBadgesCache = new Map<
  string,
  TimedCacheEntry<SanitisedBadgeSet[]>
>();
