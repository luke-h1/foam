import { useSelector } from '@legendapp/state/react';

import { type Preferences, preferences$ } from './state';

export type EmoteRenderPreferences = Pick<
  Preferences,
  | 'emojiStyle'
  | 'show7TvEmotes'
  | 'showBttvEmotes'
  | 'showFFzEmotes'
  | 'showChatterinoEmotes'
  | 'showTwitchEmotes'
  | 'showTwitchBadges'
  | 'show7tvBadges'
  | 'showFFzBadges'
  | 'showBttvBadges'
>;

export type ChatViewPreferences = Pick<
  Preferences,
  | 'chatDensity'
  | 'chatTimestamps'
  | 'disableEmoteAnimations'
  | 'highlightOwnMentions'
  | 'showInlineReplyContext'
  | 'showUnreadJumpPill'
>;

export function usePreferences(): Preferences & {
  update: (payload: Partial<Preferences>) => void;
} {
  const preferences = useSelector(() => preferences$.get());
  const update = useUpdatePreferences();

  return {
    ...preferences,
    update,
  };
}

export function useEmoteRenderPreferences(): EmoteRenderPreferences {
  return useSelector(
    () =>
      ({
        emojiStyle: preferences$.emojiStyle.get(),
        show7TvEmotes: preferences$.show7TvEmotes.get(),
        showBttvEmotes: preferences$.showBttvEmotes.get(),
        showFFzEmotes: preferences$.showFFzEmotes.get(),
        showChatterinoEmotes: preferences$.showChatterinoEmotes.get(),
        showTwitchEmotes: preferences$.showTwitchEmotes.get(),
        showTwitchBadges: preferences$.showTwitchBadges.get(),
        show7tvBadges: preferences$.show7tvBadges.get(),
        showFFzBadges: preferences$.showFFzBadges.get(),
        showBttvBadges: preferences$.showBttvBadges.get(),
      }) satisfies EmoteRenderPreferences,
  );
}

export function usePreference<K extends keyof Preferences>(
  key: K,
): Preferences[K] {
  // SAFETY: indexing the observable with a generic key widens to the union of all preference values; the child read is still the K-keyed one.
  return useSelector(() => preferences$[key].get()) as Preferences[K];
}

function updatePreferences(payload: Partial<Preferences>): void {
  preferences$.assign({
    ...payload,
    updatedAt: Date.now(),
  });
}

// A stable module-level function reference (preferences$ never changes), so
// callers that pass this through memo()'d children keep their bailout.
export function useUpdatePreferences(): (
  payload: Partial<Preferences>,
) => void {
  return updatePreferences;
}
