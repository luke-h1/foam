import { act, renderHook } from '@testing-library/react-native';

import { replacePreferences, usePreferences } from '../preferenceStore';

const basePreferences = {
  updatedAt: 1,
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
