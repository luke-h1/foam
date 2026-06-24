import { act, renderHook } from '@testing-library/react-native';

import { replacePreferences, usePreferences } from '../preferenceStore';

const basePreferences = {
  updatedAt: 1,
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
  blockedTerms: [] as string[],
  chatTimestampFormat: '24h',
  chatFontScale: 'default',
  chatScrollback: 150,
  chatDelay: 0,
  autoSyncChatDelay: false,
  deletedMessageStyle: 'notice',
  ignoreClearChat: false,
  chatMentionHaptics: true,
  customHighlights: [] as { id: string; phrase: string; color: string }[],
  savedPhrases: [] as { id: string; text: string }[],
  shakeToReport: true,
  landscapeChatWidth: null,
  customPlayerEnabled: true,
} as const;

describe('usePreferences', () => {
  beforeEach(() => {
    replacePreferences(basePreferences);
  });

  test('rerenders consumers after updating a preference', () => {
    const { result } = renderHook(() => usePreferences());

    expect(result.current.chatTimestamps).toBe(true);

    act(() => {
      result.current.update({ chatTimestamps: false });
    });

    expect(result.current.chatTimestamps).toBe(false);
  });
});
