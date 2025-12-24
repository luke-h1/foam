import { NAMESPACE } from '@app/services/storage-service';
import { Theme } from '@app/styles';
import { StateCreator, create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './util';

const PREFERENCE_STORAGE_KEY = `${NAMESPACE}_PREFERENCES`;

export interface Preferences {
  theme: Theme;
  fontScaling: number;
  systemScaling: boolean;
  hapticFeedback: boolean;
  chatTimestamps: boolean;
}

interface PreferenceState extends Preferences {
  update: (payload: Partial<Preferences>) => void;
}

const preferenceStoreCreator: StateCreator<
  PreferenceState,
  [],
  [['zustand/persist', unknown]],
  PreferenceState
> = set => ({
  theme: 'foam-dark',
  fontScaling: 1,
  systemScaling: false,
  hapticFeedback: true,
  chatTimestamps: true,
  update: payload => {
    set(payload);
  },
});

export const usePreferences = create<PreferenceState>()(
  persist(preferenceStoreCreator, {
    name: PREFERENCE_STORAGE_KEY,
    storage: createJSONStorage(() => zustandStorage),
  }),
);
