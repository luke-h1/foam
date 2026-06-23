import { fireEvent, render } from '@testing-library/react-native';

import type { Preferences } from '@app/store/preferenceStore';

import { ChatPreferenceScrollContent } from '../ChatPreferenceScreen';

const mockUpdate = jest.fn();
const mockPreferences: Preferences = {
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
  sevenTvLowResEmotes: false,
  showTwitchBadges: true,
  show7tvBadges: true,
  showFFzBadges: true,
  showBttvBadges: true,
  blockedTerms: [],
  chatTimestampFormat: '24h',
  chatFontScale: 'default',
  chatScrollback: 150,
  chatDelay: 0,
  autoSyncChatDelay: false,
  deletedMessageStyle: 'notice',
  ignoreClearChat: false,
  chatMentionHaptics: true,
  customHighlights: [],
  savedPhrases: [],
  shakeToReport: true,
  landscapeChatWidth: null,
};

jest.mock('@app/store/preferenceStore', () => ({
  usePreferences: () => ({
    ...mockPreferences,
    update: mockUpdate,
  }),
}));

jest.mock('@app/hooks/useScrollToTop', () => ({
  useScrollToTop: jest.fn(),
}));

jest.mock('@app/components/BodyScrollView/BodyScrollView', () => {
  const React = require('react');
  const { ScrollView } = require('react-native');

  return {
    BodyScrollView: (props: Record<string, unknown>) =>
      React.createElement(ScrollView, props),
  };
});

jest.mock('@app/components/ScreenHeader/ScreenHeader', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    ScreenHeader: ({ title }: { title: string }) =>
      React.createElement(Text, null, title),
  };
});

jest.mock('@expo/ui/community/segmented-control', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SegmentedControl: (props: Record<string, unknown>) =>
      React.createElement(View, {
        ...props,
        testID: 'segmented-control',
      }),
  };
});

jest.mock('../ChatPreferencesPreview', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    ChatPreferencePreview: ({
      provider,
      value,
      variant,
    }: {
      provider?: string;
      value: unknown;
      variant: string;
    }) =>
      React.createElement(
        Text,
        {
          testID: provider
            ? `chat-preference-preview-${provider}-${variant}`
            : `chat-preference-preview-${variant}`,
        },
        JSON.stringify({ provider, value, variant }),
      ),
  };
});

describe('ChatPreferenceScreen', () => {
  beforeEach(() => {
    mockUpdate.mockClear();
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
    expect(mockUpdate).toHaveBeenCalledWith({ showUnreadJumpPill: false });
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
    expect(mockUpdate).toHaveBeenCalledWith({ showAlternatingChatRows: true });
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
    expect(mockUpdate).toHaveBeenCalledWith({ show7TvEmotes: false });
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
    expect(mockUpdate).toHaveBeenCalledWith({
      disableEmoteAnimations: true,
    });
  });
});
