import {
  createObservablePersistenceLocalConfig,
  ensureObservablePersistenceConfig,
  PREFERENCES_PERSISTENCE_KEY,
} from '@app/lib/observablePersistence';
import { Theme } from '@app/styles/themes';
import { observable } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';

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

export function replacePreferences(preferences: Preferences): void {
  preferences$.set(preferences);
}
