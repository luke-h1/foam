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

export const MAX_CREATED_CLIPS = 100;

export const createdClips$ = observable<{ clips: CreatedClipRecord[] }>({
  clips: [],
});

ensureObservablePersistenceConfig();
persistObservable(createdClips$, {
  local: createObservablePersistenceLocalConfig(CREATED_CLIPS_PERSISTENCE_KEY),
});

export function addCreatedClip(record: CreatedClipRecord): void {
  const clips = createdClips$.clips.peek() ?? [];
  const withoutDuplicate = clips.filter(clip => clip.id !== record.id);
  createdClips$.clips.set(
    [record, ...withoutDuplicate].slice(0, MAX_CREATED_CLIPS),
  );
}

export function removeCreatedClip(id: string): void {
  const clips = createdClips$.clips.peek() ?? [];
  createdClips$.clips.set(clips.filter(clip => clip.id !== id));
}
