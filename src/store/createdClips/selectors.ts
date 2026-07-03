import { useSelector } from '@legendapp/state/react';

import { type CreatedClipRecord, createdClips$ } from './state';

export function useCreatedClips(): CreatedClipRecord[] {
  return useSelector(() => createdClips$.clips.get() ?? []);
}
