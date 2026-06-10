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
  streamListLayout: 'compact' | 'media';
  chatDensity: 'comfortable' | 'compact';
  showAlternatingChatRows: boolean;
  chatTimestamps: boolean;
  highlightOwnMentions: boolean;
  showInlineReplyContext: boolean;
  showRecentMessages: boolean;
  showUnreadJumpPill: boolean;
  disableChat: boolean;
  disableStream: boolean;
  useUIKitForWebView: boolean;
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
  blockedTerms: string[];
}

const initialPreferences: Preferences = {
  updatedAt: Date.now(),
  theme: 'foam-dark',
  hapticFeedback: true,
  streamListLayout: 'compact',
  chatDensity: 'comfortable',
  showAlternatingChatRows: false,
  chatTimestamps: true,
  highlightOwnMentions: true,
  showInlineReplyContext: true,
  showRecentMessages: true,
  showUnreadJumpPill: true,
  disableChat: false,
  disableStream: false,
  useUIKitForWebView: false,
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
  blockedTerms: [],
};

ensureObservablePersistenceConfig();

export const preferences$ = observable(initialPreferences);
persistObservable(preferences$, {
  local: createObservablePersistenceLocalConfig(PREFERENCES_PERSISTENCE_KEY),
});

// The 'text' stream list layout was removed; migrate old persisted values.
if ((preferences$.streamListLayout.peek() as string) === 'text') {
  preferences$.streamListLayout.set('compact');
}

export function getPreferences(): Preferences {
  return preferences$.peek();
}

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

export type ChatRenderPreferences = EmoteRenderPreferences &
  Pick<
    Preferences,
    | 'chatDensity'
    | 'chatTimestamps'
    | 'disableEmoteAnimations'
    | 'highlightOwnMentions'
    | 'showAlternatingChatRows'
    | 'showInlineReplyContext'
    | 'showRecentMessages'
    | 'showUnreadJumpPill'
  >;

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

export function useChatRenderPreferences(): ChatRenderPreferences {
  return useSelector(
    () =>
      ({
        chatDensity: preferences$.chatDensity.get(),
        chatTimestamps: preferences$.chatTimestamps.get(),
        disableEmoteAnimations: preferences$.disableEmoteAnimations.get(),
        emojiStyle: preferences$.emojiStyle.get(),
        highlightOwnMentions: preferences$.highlightOwnMentions.get(),
        showAlternatingChatRows: preferences$.showAlternatingChatRows.get(),
        show7TvEmotes: preferences$.show7TvEmotes.get(),
        showBttvEmotes: preferences$.showBttvEmotes.get(),
        showFFzEmotes: preferences$.showFFzEmotes.get(),
        showChatterinoEmotes: preferences$.showChatterinoEmotes.get(),
        showInlineReplyContext: preferences$.showInlineReplyContext.get(),
        showRecentMessages: preferences$.showRecentMessages.get(),
        showTwitchEmotes: preferences$.showTwitchEmotes.get(),
        showTwitchBadges: preferences$.showTwitchBadges.get(),
        show7tvBadges: preferences$.show7tvBadges.get(),
        showFFzBadges: preferences$.showFFzBadges.get(),
        showBttvBadges: preferences$.showBttvBadges.get(),
        showUnreadJumpPill: preferences$.showUnreadJumpPill.get(),
      }) satisfies ChatRenderPreferences,
  );
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
