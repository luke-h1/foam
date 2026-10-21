import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react-native';

import { ChatInlineImage } from '@app/components/chat/components/chat-message/renderers/chat-inline-image';
import { CHAT_SURFACE_COLORS } from '@app/components/chat/components/chat-message/util/chat-scale';
import {
  getPreferences,
  initialPreferences,
  replacePreferences,
} from '@app/store/preference-store';

import { ChatPreferenceScrollContent } from '../chat-preference-screen';

function isSwitchOn(label: string, index = 0): boolean {
  return screen.getAllByLabelText(label)[index]!.props['accessibilityState']
    .checked;
}

function getPreviewEmoteUrls(testID: string): string[] {
  return within(screen.getByTestId(testID))
    .UNSAFE_queryAllByType(ChatInlineImage.type)
    .map(image => image.props['sourceUrl']);
}

describe('ChatPreferenceScreen', () => {
  beforeEach(() => {
    replacePreferences({
      ...initialPreferences,
      updatedAt: 1,
      showUnreadJumpPill: true,
      showAlternatingChatRows: false,
      show7TvEmotes: true,
      disableEmoteAnimations: false,
    });
  });

  test('hides the jump pill in the context preview when the toggle is turned off', () => {
    render(<ChatPreferenceScrollContent />);

    const preview = screen.getByTestId('chat-preference-preview-context');

    expect(isSwitchOn('Show Jump Pill')).toBe(true);
    expect(within(preview).getByText('Jump to latest')).toBeOnTheScreen();

    fireEvent(screen.getByLabelText('Show Jump Pill'), 'valueChange', false);

    expect(isSwitchOn('Show Jump Pill')).toBe(false);
    expect(within(preview).queryByText('Jump to latest')).not.toBeOnTheScreen();
    expect(getPreferences().showUnreadJumpPill).toBe(false);
  });

  test('stripes the second preview row when alternating rows is turned on', () => {
    render(<ChatPreferenceScrollContent />);

    const getSecondRow = () =>
      within(
        screen.getByTestId('chat-preference-preview-alternating-rows'),
      ).getAllByTestId('chat-message')[1];

    expect(isSwitchOn('Alternating Rows')).toBe(false);
    expect(getSecondRow()).not.toHaveStyle({
      backgroundColor: CHAT_SURFACE_COLORS.alternatingRow,
    });

    fireEvent(screen.getByLabelText('Alternating Rows'), 'valueChange', true);

    expect(isSwitchOn('Alternating Rows')).toBe(true);
    expect(getSecondRow()).toHaveStyle({
      backgroundColor: CHAT_SURFACE_COLORS.alternatingRow,
    });
    expect(getPreferences().showAlternatingChatRows).toBe(true);
  });

  test('shows emote names as plain text in the 7TV preview when 7TV emotes are turned off', () => {
    render(<ChatPreferenceScrollContent />);

    const previewTestID = 'chat-preference-preview-7tv-emotes';
    expect(isSwitchOn('Emotes')).toBe(true);
    expect(getPreviewEmoteUrls(previewTestID)).toEqual([
      'https://cdn.7tv.app/emote/01F5PA9D3000034VRANA2SYVDP/4x.avif',
      'https://cdn.7tv.app/emote/01GB4EV0Q800090V9B3D8CGEHV/4x.avif',
    ]);

    fireEvent(screen.getAllByLabelText('Emotes')[0]!, 'valueChange', false);

    expect(isSwitchOn('Emotes')).toBe(false);
    expect(getPreviewEmoteUrls(previewTestID)).toEqual([]);
    expect(
      within(screen.getByTestId(previewTestID)).getByText(
        'hello yePls FeelsStrongMan world',
      ),
    ).toBeOnTheScreen();
    expect(getPreferences().show7TvEmotes).toBe(false);
  });

  test('loads the static emote image in the preview when emote animations are disabled', () => {
    render(<ChatPreferenceScrollContent />);

    const previewTestID = 'chat-preference-preview-emote-animations';

    expect(isSwitchOn('Disable Emote Animations')).toBe(false);
    expect(getPreviewEmoteUrls(previewTestID)).toEqual([
      'https://cdn.betterttv.net/emote/5f1c24b91ab9be446c4d78dc/3x',
      'https://cdn.betterttv.net/emote/5ee22dfb924aa35e32a7a112/3x',
    ]);

    fireEvent(
      screen.getByLabelText('Disable Emote Animations'),
      'valueChange',
      true,
    );

    expect(isSwitchOn('Disable Emote Animations')).toBe(true);
    expect(getPreviewEmoteUrls(previewTestID)).toEqual([
      'https://cdn.betterttv.net/emote/5f1c24b91ab9be446c4d78dc/3x.png',
      'https://cdn.betterttv.net/emote/5ee22dfb924aa35e32a7a112/3x',
    ]);
    expect(getPreferences().disableEmoteAnimations).toBe(true);
  });
});
