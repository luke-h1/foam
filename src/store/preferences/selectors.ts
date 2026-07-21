import { useSelector } from '@legendapp/state/react';

import { isDevToolsEnabled } from '@app/utils/devTools/isDevToolsEnabled';

import {
  lightModeEnabled$,
  paintRendererFlag$,
  type Preferences,
  preferences$,
  type SevenTvPaintRenderer,
} from './state';

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

export type ChatRowPreferences = Pick<
  Preferences,
  | 'chatDensity'
  | 'chatTimestamps'
  | 'disableEmoteAnimations'
  | 'highlightOwnMentions'
  | 'showAlternatingChatRows'
  | 'showInlineReplyContext'
>;

export type ChatHydrationPreferences = Pick<
  Preferences,
  'disableEmoteAnimations' | 'show7TvEmotes' | 'show7tvBadges'
>;

export type ChatRenderPreferences = EmoteRenderPreferences &
  Pick<
    Preferences,
    | 'animate'
    | 'chatDensity'
    | 'chatFontScale'
    | 'chatTimestamps'
    | 'customHighlights'
    | 'disableEmoteAnimations'
    | 'highlightOwnMentions'
    | 'showAlternatingChatRows'
    | 'showInlineReplyContext'
    | 'showRecentMessages'
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

export function useChatRowPreferences(): ChatRowPreferences {
  return useSelector(
    () =>
      ({
        chatDensity: preferences$.chatDensity.get(),
        chatTimestamps: preferences$.chatTimestamps.get(),
        disableEmoteAnimations: preferences$.disableEmoteAnimations.get(),
        highlightOwnMentions: preferences$.highlightOwnMentions.get(),
        showAlternatingChatRows: preferences$.showAlternatingChatRows.get(),
        showInlineReplyContext: preferences$.showInlineReplyContext.get(),
      }) satisfies ChatRowPreferences,
  );
}

export function useChatRenderPreferences(): ChatRenderPreferences {
  return useSelector(
    () =>
      ({
        animate: preferences$.animate.get(),
        chatDensity: preferences$.chatDensity.get(),
        chatFontScale: preferences$.chatFontScale.get(),
        chatTimestamps: preferences$.chatTimestamps.get(),
        customHighlights: preferences$.customHighlights.get(),
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

export function useLightModeEnabled(): boolean {
  return useSelector(() => lightModeEnabled$.get());
}

export function usePaintRenderer(): SevenTvPaintRenderer {
  return useSelector(() => {
    if (isDevToolsEnabled) {
      return preferences$.sevenTvPaintRenderer.get();
    }
    return paintRendererFlag$.get();
  });
}

export function useChatHydrationPreferences(): ChatHydrationPreferences {
  return useSelector(
    () =>
      ({
        disableEmoteAnimations: preferences$.disableEmoteAnimations.get(),
        show7TvEmotes: preferences$.show7TvEmotes.get(),
        show7tvBadges: preferences$.show7tvBadges.get(),
      }) satisfies ChatHydrationPreferences,
  );
}

export function usePreference<K extends keyof Preferences>(
  key: K,
): Preferences[K] {
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
