import {
  createObservablePersistenceLocalConfig,
  ensureObservablePersistenceConfig,
  PREFERENCES_PERSISTENCE_KEY,
} from '@app/lib/observablePersistence';
import { Theme } from '@app/styles/themes';
import { observable } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';
import { useSelector } from '@legendapp/state/react';

export interface Preferences {
  updatedAt: number;
  theme: Theme;
  hapticFeedback: boolean;
  streamListLayout: 'compact' | 'media' | 'text';
  chatDensity: 'comfortable' | 'compact';
  chatTimestamps: boolean;
  highlightOwnMentions: boolean;
  showInlineReplyContext: boolean;
  showRecentMessages: boolean;
  showUnreadJumpPill: boolean;
  emojiStyle: 'twitter' | 'google';
  show7TvEmotes: boolean;
  showBttvEmotes: boolean;
  showFFzEmotes: boolean;
  showChatterinoEmotes: boolean;
  showTwitchEmotes: boolean;
  disableEmoteAnimations: boolean;
  showTwitchBadges: boolean;
  show7tvBadges: boolean;
  showFFzBadges: boolean;
  showBttvBadges: boolean;
}

const initialPreferences: Preferences = {
  updatedAt: Date.now(),
  theme: 'foam-dark',
  hapticFeedback: true,
  streamListLayout: 'compact',
  chatDensity: 'comfortable',
  chatTimestamps: true,
  highlightOwnMentions: true,
  showInlineReplyContext: true,
  showRecentMessages: true,
  showUnreadJumpPill: true,
  emojiStyle: 'twitter',
  show7TvEmotes: true,
  showBttvEmotes: true,
  showFFzEmotes: true,
  showChatterinoEmotes: true,
  showTwitchEmotes: true,
  disableEmoteAnimations: false,
  showTwitchBadges: true,
  show7tvBadges: true,
  showFFzBadges: true,
  showBttvBadges: true,
};

ensureObservablePersistenceConfig();

export const preferences$ = observable(initialPreferences);
persistObservable(preferences$, {
  local: createObservablePersistenceLocalConfig(PREFERENCES_PERSISTENCE_KEY),
});

export function getPreferences(): Preferences {
  return preferences$.peek();
}

export function usePreferences(): Preferences & {
  update: (payload: Partial<Preferences>) => void;
} {
  const preferences = useSelector(preferences$);
  return {
    ...preferences,
    update: (payload: Partial<Preferences>) => {
      preferences$.assign({
        ...payload,
        updatedAt: Date.now(),
      });
    },
  };
}

export function usePreference<K extends keyof Preferences>(
  key: K,
): Preferences[K] {
  return useSelector(() => preferences$[key].get()) as Preferences[K];
}

export function useUpdatePreferences(): (
  payload: Partial<Preferences>,
) => void {
  return (payload: Partial<Preferences>) => {
    preferences$.assign({
      ...payload,
      updatedAt: Date.now(),
    });
  };
}

export function replacePreferences(preferences: Preferences): void {
  preferences$.set(preferences);
}
