import { observable } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';

import {
  CREATED_CLIPS_PERSISTENCE_KEY,
  createObservablePersistenceLocalConfig,
  ensureObservablePersistenceConfig,
} from '@app/lib/observablePersistence';

/**
 * Clips created from inside foam. Helix has no "clips by creator" query, so
 * this local record is the only way to list them without scraping.
 */
export interface CreatedClipRecord {
  id: string;
  broadcasterLogin: string;
  broadcasterName: string;
  createdAt: number;
}

export const createdClips$ = observable<{ clips: CreatedClipRecord[] }>({
  clips: [],
});

ensureObservablePersistenceConfig();
persistObservable(createdClips$, {
  local: createObservablePersistenceLocalConfig(CREATED_CLIPS_PERSISTENCE_KEY),
});
