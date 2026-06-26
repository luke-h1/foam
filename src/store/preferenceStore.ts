import { observable } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';
import { useSelector } from '@legendapp/state/react';
import { z } from 'zod';

import {
  createObservablePersistenceLocalConfig,
  ensureObservablePersistenceConfig,
  PREFERENCES_PERSISTENCE_KEY,
} from '@app/lib/observablePersistence';
import { Theme } from '@app/styles/themes';

export interface CustomHighlight {
  id: string;
  phrase: string;
  color: string;
}

export interface SavedPhrase {
  id: string;
  text: string;
}

export type ChatFontScale = 'small' | 'default' | 'large';
export type ChatTimestampFormat = '24h' | '12h';
export type DeletedMessageStyle = 'notice' | 'hidden';
export type ChatScrollbackLength = 150 | 200 | 250;

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
  chatTimestampFormat: ChatTimestampFormat;
  chatFontScale: ChatFontScale;
  chatScrollback: ChatScrollbackLength;
  /**
   * Seconds to hold new chat messages before showing them. 0 = off.
   */
  chatDelay: number;
  deletedMessageStyle: DeletedMessageStyle;
  ignoreClearChat: boolean;
  chatMentionHaptics: boolean;
  customHighlights: CustomHighlight[];
  savedPhrases: SavedPhrase[];
  shakeToReport: boolean;
  /**
   * User-chosen landscape chat panel width in px, set by dragging the
   * video/chat divider. Null until the user resizes, then re-clamped to the
   * current screen at layout time so it stays valid across devices.
   */
  landscapeChatWidth: number | null;
  /**
   * Use foam's custom-controls player (hidden Twitch chrome + ControlsOverlay).
   * Off = stock player.
   */
  customPlayerEnabled: boolean;
  /**
   * Opt in to anonymous Statsig usage analytics. Off = no Statsig client is
   * created and no events are sent.
   */
  analyticsEnabled: boolean;
}

export const preferencesSchema = z.object({
  updatedAt: z.number(),
  theme: z.literal('foam-dark'),
  hapticFeedback: z.boolean(),
  streamListLayout: z.enum(['compact', 'media']),
  chatDensity: z.enum(['comfortable', 'compact']),
  showAlternatingChatRows: z.boolean(),
  chatTimestamps: z.boolean(),
  highlightOwnMentions: z.boolean(),
  showInlineReplyContext: z.boolean(),
  showRecentMessages: z.boolean(),
  showUnreadJumpPill: z.boolean(),
  disableChat: z.boolean(),
  disableStream: z.boolean(),
  useUIKitForWebView: z.boolean(),
  emojiStyle: z.enum(['twitter', 'google']),
  show7TvEmotes: z.boolean(),
  showBttvEmotes: z.boolean(),
  showFFzEmotes: z.boolean(),
  showChatterinoEmotes: z.boolean(),
  showTwitchEmotes: z.boolean(),
  disableEmoteAnimations: z.boolean(),
  showTwitchBadges: z.boolean(),
  show7tvBadges: z.boolean(),
  showFFzBadges: z.boolean(),
  showBttvBadges: z.boolean(),
  blockedTerms: z.array(z.string()),
  chatTimestampFormat: z.enum(['24h', '12h']),
  chatFontScale: z.enum(['small', 'default', 'large']),
  chatScrollback: z.union([z.literal(150), z.literal(200), z.literal(250)]),
  chatDelay: z.number(),
  deletedMessageStyle: z.enum(['notice', 'hidden']),
  ignoreClearChat: z.boolean(),
  chatMentionHaptics: z.boolean(),
  customHighlights: z.array(
    z.object({ id: z.string(), phrase: z.string(), color: z.string() }),
  ),
  savedPhrases: z.array(z.object({ id: z.string(), text: z.string() })),
  shakeToReport: z.boolean(),
  landscapeChatWidth: z.number().nullable(),
  customPlayerEnabled: z.boolean(),
  analyticsEnabled: z.boolean(),
}) satisfies z.ZodType<Preferences>;

const initialPreferences: Preferences = {
  updatedAt: Date.now(),
  theme: 'foam-dark',
  hapticFeedback: true,
  streamListLayout: 'compact',
  chatDensity: 'comfortable',
  showAlternatingChatRows: false,
  chatTimestamps: false,
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
  chatTimestampFormat: '24h',
  chatFontScale: 'default',
  chatScrollback: 150,
  chatDelay: 0,
  deletedMessageStyle: 'notice',
  ignoreClearChat: false,
  chatMentionHaptics: true,
  customHighlights: [],
  savedPhrases: [],
  shakeToReport: true,
  landscapeChatWidth: null,
  customPlayerEnabled: true,
  analyticsEnabled: true,
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
