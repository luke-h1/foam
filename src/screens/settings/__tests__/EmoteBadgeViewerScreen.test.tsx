import { fireEvent, screen } from '@testing-library/react-native';

import { EmoteBadgeViewerScreen } from '@app/screens/settings/EmoteBadgeViewerScreen';
import { clearGlobalResourceCache } from '@app/store/chat/actions/channel-resources';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { makeEmptyGlobalCacheData } from '@app/store/chat/types/constants';
import { stubEmoteProviderServices } from '@app/test/emote-provider-services';
import render from '@app/test/render';

import {
  bttvGlobalEmotesFixture,
  sevenTvGlobalBadgesFixture,
  twitchGlobalBadgesFixture,
  twitchGlobalEmotesFixture,
} from './__fixtures__/global-emote-badge-data.fixture';

// LegendList/SectionList come from the root __mocks__/@legendapp/list manual mocks (every item renders through renderItem so grid content is assertable). Preview sheets render for real; expo-media-library is faked at the root too.

describe('EmoteBadgeViewerScreen', () => {
  let providers: ReturnType<typeof stubEmoteProviderServices>;

  beforeEach(() => {
    clearGlobalResourceCache();
    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());

    providers = stubEmoteProviderServices();

    providers.getGlobalEmotes.mockResolvedValue(twitchGlobalEmotesFixture);
    providers.getBttvGlobalEmotes.mockResolvedValue(bttvGlobalEmotesFixture);
    providers.listTwitchGlobalBadges.mockResolvedValue(
      twitchGlobalBadgesFixture,
    );
    providers.fetchAllBadges.mockResolvedValue(sevenTvGlobalBadgesFixture);
  });

  test('renders global emote provider sets by default', async () => {
    render(<EmoteBadgeViewerScreen />);

    expect(await screen.findByText('Global Emotes')).toBeOnTheScreen();

    expect(screen.getByLabelText('Kappa')).toBeOnTheScreen();
  });

  test('renders global badges when the badges tab is selected', async () => {
    render(<EmoteBadgeViewerScreen />);

    await screen.findByText('Global Emotes');

    fireEvent.press(screen.getByTestId('segmented-control-option-Badges'));

    expect(
      await screen.findByTestId('badge-cell-moderator_1_1'),
    ).toBeOnTheScreen();

    expect(screen.getByText('Twitch')).toBeOnTheScreen();
  });

  test('renders 7TV badges in the badges tab', async () => {
    render(<EmoteBadgeViewerScreen />);

    await screen.findByText('Global Emotes');

    fireEvent.press(screen.getByTestId('segmented-control-option-Badges'));

    expect(
      await screen.findByTestId('badge-cell-7tv_badge_1'),
    ).toBeOnTheScreen();

    expect(screen.getByText('7TV')).toBeOnTheScreen();
  });

  test('shows the empty state when no badges are available', async () => {
    providers.listTwitchGlobalBadges.mockResolvedValue([]);
    providers.fetchAllBadges.mockResolvedValue([]);

    render(<EmoteBadgeViewerScreen />);

    await screen.findByText('Global Emotes');

    fireEvent.press(screen.getByTestId('segmented-control-option-Badges'));

    expect(await screen.findByText('No badges found')).toBeOnTheScreen();
  });
});
