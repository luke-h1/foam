import { Platform } from 'react-native';

import { observable, when } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';
import { useSelector } from '@legendapp/state/react';
import { z } from 'zod';

import {
  createObservablePersistenceLocalConfig,
  ensureObservablePersistenceConfig,
  PREFERENCES_PERSISTENCE_KEY,
} from '@app/lib/observablePersistence';
import type { ChatTimestampFormat } from '@app/types/chat/chatTimestampFormat';
import type { CustomHighlight } from '@app/types/chat/customHighlight';
import { isDevToolsEnabled } from '@app/utils/dev-tools/isDevToolsEnabled';
import { deepEqualJson } from '@app/utils/object/deepEqualJson';

let cachedPreferencesSchema: ReturnType<typeof buildPreferencesSchema> | null =
  null;

/**
 * Built on first use instead of at module scope - constructing ~50 zod
 * validators was part of every boot for a schema only validation reads.
 */
export function getPreferencesSchema() {
  cachedPreferencesSchema ??= buildPreferencesSchema();
  return cachedPreferencesSchema;
}

function buildPreferencesSchema() {
  return z.object({
    updatedAt: z.number(),
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
    emojiStyle: z.enum(['twitter', 'google']),
    show7TvEmotes: z.boolean(),
    showBttvEmotes: z.boolean(),
    showFFzEmotes: z.boolean(),
    showTwitchEmotes: z.boolean(),
    disableEmoteAnimations: z.boolean(),
    showTwitchBadges: z.boolean(),
    show7tvBadges: z.boolean(),
    showFFzBadges: z.boolean(),
    showChatGifs: z.boolean(),
    showBttvBadges: z.boolean(),
    blockedTerms: z.array(z.string()),
    chatTimestampFormat: z.enum([
      '24h',
      '12h',
    ]) satisfies z.ZodType<ChatTimestampFormat>,
    chatFontScale: z.enum(['small', 'default', 'large']),
    chatScrollback: z.union([z.literal(150), z.literal(200), z.literal(250)]),
    chatDelay: z.union([z.literal('auto'), z.literal('off'), z.number()]),
    deletedMessageStyle: z.enum(['notice', 'hidden']),
    ignoreClearChat: z.boolean(),
    chatMentionHaptics: z.boolean(),
    customHighlights: z.array(
      z.object({
        id: z.string(),
        phrase: z.string(),
        color: z.string(),
      }) satisfies z.ZodType<CustomHighlight>,
    ),
    savedPhrases: z.array(z.object({ id: z.string(), text: z.string() })),
    shakeToReport: z.boolean(),
    landscapeChatWidth: z.number().nullable(),
    analyticsEnabled: z.boolean(),
    sharedChatEnabled: z.boolean(),
    enhancedVideoStability: z.boolean(),
    chatDebugTools: z.boolean(),
    sevenTvPaintRenderer: z.enum(['off', 'native', 'skia', 'webview']),
  });
}

export type Preferences = z.infer<ReturnType<typeof buildPreferencesSchema>>;

export type SavedPhrase = Preferences['savedPhrases'][number];
export type ChatDensity = Preferences['chatDensity'];
export type ChatFontScale = Preferences['chatFontScale'];
export type DeletedMessageStyle = Preferences['deletedMessageStyle'];
export type ChatScrollbackLength = Preferences['chatScrollback'];
export type ChatDelaySetting = Preferences['chatDelay'];
export type SevenTvPaintRenderer = Preferences['sevenTvPaintRenderer'];
export type PaintRendererFlag = Exclude<SevenTvPaintRenderer, 'webview'>;

const DEVICE_LOCAL_PREFERENCE_KEYS = [
  'landscapeChatWidth',
  'chatDebugTools',
  'disableChat',
  'disableStream',
  'sevenTvPaintRenderer',
] as const satisfies readonly (keyof Preferences)[];

type DeviceLocalPreferenceKey = (typeof DEVICE_LOCAL_PREFERENCE_KEYS)[number];

export type SyncedPreferences = Omit<Preferences, DeviceLocalPreferenceKey>;

const deviceLocalPreferenceKeys = new Set<string>(DEVICE_LOCAL_PREFERENCE_KEYS);

export const initialPreferences: Preferences = {
  updatedAt: 0,
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
  emojiStyle: 'twitter',
  show7TvEmotes: true,
  showBttvEmotes: true,
  showFFzEmotes: true,
  showTwitchEmotes: true,
  disableEmoteAnimations: false,
  showTwitchBadges: true,
  show7tvBadges: true,
  showFFzBadges: true,
  showBttvBadges: true,
  showChatGifs: false,
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
  analyticsEnabled: true,
  sharedChatEnabled: true,
  enhancedVideoStability: false,
  chatDebugTools: isDevToolsEnabled,
  sevenTvPaintRenderer: 'skia',
};

export interface StoredPreferences extends Partial<
  Omit<Preferences, 'streamListLayout' | 'sevenTvPaintRenderer'>
> {
  streamListLayout?: Preferences['streamListLayout'] | 'text';
  sevenTvPaintRenderer?: SevenTvPaintRenderer | 'auto';
  customPlayerEnabled?: boolean;
  showChatterinoEmotes?: boolean;
  theme?: string;
  useUIKitForWebView?: boolean;
}

export function migratePreferencesPayload(
  stored: StoredPreferences,
): Preferences {
  const merged = { ...initialPreferences, ...stored };

  delete merged.customPlayerEnabled;
  delete merged.showChatterinoEmotes;
  delete merged.theme;
  delete merged.useUIKitForWebView;

  return {
    ...merged,
    streamListLayout:
      merged.streamListLayout === 'text' ? 'compact' : merged.streamListLayout,
    sevenTvPaintRenderer:
      merged.sevenTvPaintRenderer === 'auto'
        ? 'native'
        : merged.sevenTvPaintRenderer,
    chatDelay: merged.chatDelay === 0 ? 'auto' : merged.chatDelay,
  };
}

ensureObservablePersistenceConfig();

export const preferences$ = observable(initialPreferences);

export const paintRendererFlag$ = observable<PaintRendererFlag>('skia');

const persistedPreferences$ = persistObservable(preferences$, {
  local: createObservablePersistenceLocalConfig(PREFERENCES_PERSISTENCE_KEY),
});

void when(persistedPreferences$?._state?.isLoadedLocal, () => {
  const persisted: StoredPreferences = preferences$.peek();
  const migrated = migratePreferencesPayload(persisted);

  if (!deepEqualJson<StoredPreferences>(migrated, persisted)) {
    preferences$.set(migrated);
  }
});

export function getPreferences(): Preferences {
  return preferences$.peek();
}

export function resolvePlatformPaintRenderer<
  Renderer extends SevenTvPaintRenderer,
>(renderer: Renderer): Renderer | 'native' {
  return Platform.OS === 'web' && renderer === 'skia' ? 'native' : renderer;
}

export function usePaintRenderer(): SevenTvPaintRenderer {
  return useSelector(() => {
    if (!isDevToolsEnabled) {
      return paintRendererFlag$.get();
    }

    return resolvePlatformPaintRenderer(
      preferences$.sevenTvPaintRenderer.get(),
    );
  });
}

export type EmoteRenderPreferences = Pick<
  Preferences,
  | 'emojiStyle'
  | 'show7TvEmotes'
  | 'showBttvEmotes'
  | 'showFFzEmotes'
  | 'showTwitchEmotes'
  | 'showTwitchBadges'
  | 'show7tvBadges'
  | 'showFFzBadges'
  | 'showBttvBadges'
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
    | 'showChatGifs'
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
        showInlineReplyContext: preferences$.showInlineReplyContext.get(),
        showRecentMessages: preferences$.showRecentMessages.get(),
        showTwitchEmotes: preferences$.showTwitchEmotes.get(),
        showTwitchBadges: preferences$.showTwitchBadges.get(),
        showChatGifs: preferences$.showChatGifs.get(),
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
  // SAFETY: the selector reads the same `key` the caller asked for, so its widened union value is that key's `Preferences[K]`.
  return useSelector(() => preferences$[key].get()) as Preferences[K];
}

/**
 * Reads several preferences with one subscription. Pass a module-level key
 * list, so the selector reads the same keys on every render.
 */
export function usePreferences<K extends keyof Preferences>(
  keys: readonly K[],
): Pick<Preferences, K> {
  return useSelector(
    () =>
      // SAFETY: the entries hold exactly one value for each key in `keys`.
      Object.fromEntries(
        keys.map(key => [key, preferences$[key].get()]),
      ) as Pick<Preferences, K>,
  );
}

export function updatePreferences(payload: Partial<Preferences>): void {
  const touchesSyncedKey = Object.keys(payload).some(
    key => !deviceLocalPreferenceKeys.has(key),
  );

  preferences$.assign(
    touchesSyncedKey ? { ...payload, updatedAt: Date.now() } : payload,
  );
}

export function replacePreferences(preferences: Preferences): void {
  preferences$.set(preferences);
}

export function toSyncedPreferences(
  preferences: Preferences,
): SyncedPreferences {
  const synced: Partial<Preferences> = { ...preferences };

  for (const key of DEVICE_LOCAL_PREFERENCE_KEYS) {
    delete synced[key];
  }

  // SAFETY: the copy holds every key, and the loop removed exactly the device-local ones.
  return synced as SyncedPreferences;
}

export function applyRemotePreferences(remote: Preferences): void {
  const local = preferences$.peek();

  preferences$.set({ ...remote, ...pickDeviceLocalPreferences(local) });
}

function pickDeviceLocalPreferences(
  preferences: Preferences,
): Pick<Preferences, DeviceLocalPreferenceKey> {
  // SAFETY: the entries hold exactly one value for each device-local key.
  return Object.fromEntries(
    DEVICE_LOCAL_PREFERENCE_KEYS.map(key => [key, preferences[key]]),
  ) as Pick<Preferences, DeviceLocalPreferenceKey>;
}
