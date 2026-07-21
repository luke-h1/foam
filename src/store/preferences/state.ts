import { Appearance } from 'react-native';

import { observable, observe, when } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';
import { z } from 'zod';

import {
  createObservablePersistenceLocalConfig,
  ensureObservablePersistenceConfig,
  PREFERENCES_PERSISTENCE_KEY,
} from '@app/lib/observablePersistence';
import { ThemeMode } from '@app/styles/themes';

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
export type ChatDelaySetting = 'auto' | 'off' | number;
export type SevenTvPaintRenderer = 'off' | 'native' | 'skia' | 'webview';
export type PaintRendererFlag = 'off' | 'native' | 'skia';

export interface Preferences {
  updatedAt: number;
  theme: ThemeMode;
  hapticFeedback: boolean;
  streamListLayout: 'compact' | 'media';
  chatDensity: 'comfortable' | 'compact';
  showAlternatingChatRows: boolean;
  /**
   * Slide-in animation for new chat messages.
   */
  animate: boolean;
  chatTimestamps: boolean;
  highlightOwnMentions: boolean;
  showInlineReplyContext: boolean;
  showRecentMessages: boolean;
  showUnreadJumpPill: boolean;
  /**
   * Show a system message when a user joins or leaves the channel's chat, like
   * Chatterino. Requires the IRC membership capability, so toggling it
   * reconnects chat.
   */
  showJoinPartMessages: boolean;
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
   * Hold on new chat messages so chat lines up with the latency-delayed
   * video. 'auto' follows the measured stream latency, 'off' shows messages
   * immediately, a number holds them for that many seconds.
   */
  chatDelay: ChatDelaySetting;
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
   * Opt in to anonymous Vexo usage analytics. Off = Vexo tracking is disabled
   * and no events are sent.
   */
  analyticsEnabled: boolean;
  sharedChatEnabled: boolean;
  enhancedVideoStability: boolean;
  sevenTvPaintRenderer: SevenTvPaintRenderer;
}

export const preferencesSchema = z.object({
  updatedAt: z.number(),
  theme: z.enum(['system', 'light', 'dark']),
  hapticFeedback: z.boolean(),
  streamListLayout: z.enum(['compact', 'media']),
  chatDensity: z.enum(['comfortable', 'compact']),
  showAlternatingChatRows: z.boolean(),
  animate: z.boolean(),
  chatTimestamps: z.boolean(),
  highlightOwnMentions: z.boolean(),
  showInlineReplyContext: z.boolean(),
  showRecentMessages: z.boolean(),
  showUnreadJumpPill: z.boolean(),
  showJoinPartMessages: z.boolean(),
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
  chatDelay: z.union([z.literal('auto'), z.literal('off'), z.number()]),
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
  sharedChatEnabled: z.boolean(),
  enhancedVideoStability: z.boolean(),
  sevenTvPaintRenderer: z.enum(['off', 'native', 'skia', 'webview']),
}) satisfies z.ZodType<Preferences>;

export const initialPreferences: Preferences = {
  updatedAt: Date.now(),
  theme: 'system',
  hapticFeedback: true,
  streamListLayout: 'compact',
  chatDensity: 'comfortable',
  showAlternatingChatRows: false,
  animate: false,
  chatTimestamps: false,
  highlightOwnMentions: true,
  showInlineReplyContext: true,
  showRecentMessages: true,
  showUnreadJumpPill: true,
  showJoinPartMessages: false,
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
  chatDelay: 'auto',
  deletedMessageStyle: 'notice',
  ignoreClearChat: false,
  chatMentionHaptics: true,
  customHighlights: [],
  savedPhrases: [],
  shakeToReport: true,
  landscapeChatWidth: null,
  customPlayerEnabled: true,
  analyticsEnabled: true,
  sharedChatEnabled: true,
  enhancedVideoStability: false,
  sevenTvPaintRenderer: 'native',
};

ensureObservablePersistenceConfig();

export const preferences$ = observable(initialPreferences);

export const paintRendererFlag$ = observable<PaintRendererFlag>('native');

/**
 * Remote-config light-mode rollout gate, mirrored per release track by
 * `useSyncLightModeFlag`. Off = the app renders dark regardless of the
 * persisted theme preference.
 */
export const lightModeEnabled$ = observable(false);
const persistedPreferences$ = persistObservable(preferences$, {
  local: createObservablePersistenceLocalConfig(PREFERENCES_PERSISTENCE_KEY),
});

when(persistedPreferences$?._state?.isLoadedLocal, () => {
  // The app was dark-only before theme modes existed; migrate the old value.
  if ((preferences$.theme.peek() as string) === 'foam-dark') {
    preferences$.theme.set('system');
  }

  // The 'text' stream list layout was removed; migrate old persisted values.
  if ((preferences$.streamListLayout.peek() as string) === 'text') {
    preferences$.streamListLayout.set('compact');
  }

  if ((preferences$.sevenTvPaintRenderer.peek() as string) === 'auto') {
    preferences$.sevenTvPaintRenderer.set('native');
  }

  // chatDelay 0 predates 'auto'/'off' and was the numeric Off default; the
  // explicit value is 'off' now, so legacy zeros move to the new default.
  if (preferences$.chatDelay.peek() === 0) {
    preferences$.chatDelay.set('auto');
  }
});

observe(() => {
  const mode = lightModeEnabled$.get() ? preferences$.theme.get() : 'dark';
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
});

export function getPreferences(): Preferences {
  return preferences$.peek();
}

export function replacePreferences(preferences: Preferences): void {
  preferences$.set(preferences);
}
