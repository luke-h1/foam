import { useSelector } from '@legendapp/state/react';

import {
  type CreatedClipRecord,
  createdClips$,
} from '../observables/created-clips';

export function useCreatedClips(): CreatedClipRecord[] {
  return useSelector(() => createdClips$.clips.get() ?? []);
}
