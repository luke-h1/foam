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
  /**
   * Emote providers
   */
  show7TvEmotes: boolean;
  showBttvEmotes: boolean;
  showFFzEmotes: boolean;
  showChatterinoEmotes: boolean;
  showTwitchEmotes: boolean;
  showTwitchBadges: boolean;
  show7tvBadges: boolean;
  showFFzBadges: boolean;
  showBttvBadges: boolean;
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
  show7TvEmotes: true,
  showBttvEmotes: true,
  showFFzEmotes: true,
  showChatterinoEmotes: true,
  showTwitchEmotes: true,
  showTwitchBadges: true,
  show7tvBadges: true,
  showFFzBadges: true,
  showBttvBadges: true,
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
