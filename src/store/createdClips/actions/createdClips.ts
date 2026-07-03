import {
  type CreatedClipRecord,
  createdClips$,
} from '../observables/createdClips';

export const MAX_CREATED_CLIPS = 100;

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
