import { Text } from 'react-native';

import { fireEvent, render } from '@testing-library/react-native';

import {
  getPreferences,
  type Preferences,
  replacePreferences,
} from '@app/store/preferenceStore';

import { ChatPreferenceScrollContent } from '../ChatPreferenceScreen';
import * as ChatPreferencesPreviewModule from '../ChatPreferencesPreview';

const mockPreferences: Preferences = {
  updatedAt: 1,
  theme: 'foam-dark',
  hapticFeedback: true,
  streamListLayout: 'compact',
  chatDensity: 'comfortable',
  showAlternatingChatRows: false,
  animate: false,
  chatTimestamps: true,
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
  chatDelay: 'off',
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
  chatDebugTools: false,
  sevenTvPaintRenderer: 'native',
};

// ChatPreferencePreview is React.memo-wrapped, so the export is a memo descriptor, not a callable - spy on its inner `.type` render function.
jest
  .spyOn(ChatPreferencesPreviewModule.ChatPreferencePreview, 'type')
  .mockImplementation(props => {
    const provider = 'provider' in props ? props.provider : undefined;
    const testID = provider
      ? `chat-preference-preview-${provider}-${props.variant}`
      : `chat-preference-preview-${props.variant}`;

    return (
      <Text testID={testID}>
        {JSON.stringify({
          provider,
          value: props.value,
          variant: props.variant,
        })}
      </Text>
    );
  });

describe('ChatPreferenceScreen', () => {
  beforeEach(() => {
    replacePreferences(mockPreferences);
  });

  test('updates the context preview immediately when toggling a setting', () => {
    const { getByLabelText, getByTestId } = render(
      <ChatPreferenceScrollContent />,
    );

    expect(
      getByTestId('chat-preference-preview-context').props.children,
    ).toContain('"showUnreadJumpPill":true');

    fireEvent(getByLabelText('Show Jump Pill'), 'valueChange', false);

    expect(
      getByTestId('chat-preference-preview-context').props.children,
    ).toContain('"showUnreadJumpPill":false');
    expect(getPreferences().showUnreadJumpPill).toBe(false);
  });

  test('updates alternating rows immediately when toggled', () => {
    const { getByLabelText, getByTestId } = render(
      <ChatPreferenceScrollContent />,
    );

    expect(
      getByTestId('chat-preference-preview-alternatingRows').props.children,
    ).toContain('"value":false');

    fireEvent(getByLabelText('Alternating Rows'), 'valueChange', true);

    expect(
      getByTestId('chat-preference-preview-alternatingRows').props.children,
    ).toContain('"value":true');
    expect(getPreferences().showAlternatingChatRows).toBe(true);
  });

  test('updates provider previews immediately when toggling provider media', () => {
    const { getAllByLabelText, getByTestId } = render(
      <ChatPreferenceScrollContent />,
    );

    expect(
      getByTestId('chat-preference-preview-7tv-providerEmotes').props.children,
    ).toContain('"value":true');

    fireEvent(getAllByLabelText('Emotes')[0]!, 'valueChange', false);

    expect(
      getByTestId('chat-preference-preview-7tv-providerEmotes').props.children,
    ).toContain('"value":false');
    expect(getPreferences().show7TvEmotes).toBe(false);
  });

  test('updates the emote animation preview immediately when toggling media', () => {
    const { getByLabelText, getByTestId } = render(
      <ChatPreferenceScrollContent />,
    );

    expect(
      getByTestId('chat-preference-preview-emoteAnimations').props.children,
    ).toContain('"value":false');

    fireEvent(getByLabelText('Disable Emote Animations'), 'valueChange', true);

    expect(
      getByTestId('chat-preference-preview-emoteAnimations').props.children,
    ).toContain('"value":true');
    expect(getPreferences().disableEmoteAnimations).toBe(true);
  });
});
