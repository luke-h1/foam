import { fireEvent, screen } from '@testing-library/react-native';

import * as SegmentedControlModule from '@app/components/SegmentedControl/SegmentedControl';
import { EmoteBadgeViewerScreen } from '@app/screens/SettingsScreen/EmoteBadgeViewerScreen';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import { clearGlobalResourceCache } from '@app/store/chat/actions/channelResources';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { makeEmptyGlobalCacheData } from '@app/store/chat/types/constants';
import render from '@app/test/render';

import {
  bttvGlobalEmotesFixture,
  sevenTvGlobalBadgesFixture,
  twitchGlobalBadgesFixture,
  twitchGlobalEmotesFixture,
} from './__fixtures__/globalEmoteBadgeData.fixture';

// LegendList/SectionList come from the root __mocks__/@legendapp/list manual mocks (every item renders through renderItem so grid content is assertable). Preview sheets render for real; expo-media-library is faked at the root too.

// The native @expo/ui SegmentedControl cannot receive segment-change events in tests; expose each segment as a pressable.
jest
  .spyOn(SegmentedControlModule, 'SegmentedControl')
  .mockImplementation(({ items, onChange }) => {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      View,
      null,
      items.map(({ label }: { label: string }, i: number) =>
        React.createElement(
          TouchableOpacity,
          {
            key: label,
            testID: `tab-${label.toLowerCase()}`,
            onPress: () => onChange(i),
          },
          React.createElement(Text, null, label),
        ),
      ),
    );
  });

const getGlobalEmotesSpy = jest.spyOn(twitchEmoteService, 'getGlobalEmotes');
const bttvGlobalEmotesSpy = jest.spyOn(
  bttvEmoteService,
  'getSanitisedGlobalEmotes',
);
const ffzGlobalEmotesSpy = jest.spyOn(ffzService, 'getSanitisedGlobalEmotes');
const sevenTvEmoteSetSpy = jest.spyOn(sevenTvService, 'getSanitisedEmoteSet');
const listGlobalBadgesSpy = jest.spyOn(
  twitchBadgeService,
  'listSanitisedGlobalBadges',
);
const ffzGlobalBadgesSpy = jest.spyOn(ffzService, 'getSanitisedGlobalBadges');
const sevenTvBadgesSpy = jest.spyOn(sevenTvService, 'fetchAllBadges');

describe('EmoteBadgeViewerScreen', () => {
  beforeEach(() => {
    clearGlobalResourceCache();
    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());
    getGlobalEmotesSpy.mockResolvedValue(twitchGlobalEmotesFixture);
    bttvGlobalEmotesSpy.mockResolvedValue(bttvGlobalEmotesFixture);
    ffzGlobalEmotesSpy.mockResolvedValue([]);
    sevenTvEmoteSetSpy.mockResolvedValue([]);
    listGlobalBadgesSpy.mockResolvedValue(twitchGlobalBadgesFixture);
    ffzGlobalBadgesSpy.mockResolvedValue([]);
    sevenTvBadgesSpy.mockResolvedValue(sevenTvGlobalBadgesFixture);
  });

  test('renders global emote provider sets by default', async () => {
    render(<EmoteBadgeViewerScreen />);

    expect(await screen.findByText('Global Emotes')).toBeOnTheScreen();
  });

  test('renders global badges when the badges tab is selected', async () => {
    render(<EmoteBadgeViewerScreen />);

    await screen.findByText('Global Emotes');

    fireEvent.press(screen.getByTestId('tab-badges'));

    expect(
      await screen.findByTestId('badge-cell-moderator_1_1'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Twitch')).toBeOnTheScreen();
    expect(listGlobalBadgesSpy).toHaveBeenCalled();
  });

  test('renders 7TV badges in the badges tab', async () => {
    render(<EmoteBadgeViewerScreen />);

    await screen.findByText('Global Emotes');

    fireEvent.press(screen.getByTestId('tab-badges'));

    expect(
      await screen.findByTestId('badge-cell-7tv_badge_1'),
    ).toBeOnTheScreen();
    expect(screen.getByText('7TV')).toBeOnTheScreen();
    expect(sevenTvBadgesSpy).toHaveBeenCalled();
  });

  test('shows the empty state when no badges are available', async () => {
    listGlobalBadgesSpy.mockResolvedValue([]);
    sevenTvBadgesSpy.mockResolvedValue([]);

    render(<EmoteBadgeViewerScreen />);

    await screen.findByText('Global Emotes');

    fireEvent.press(screen.getByTestId('tab-badges'));

    expect(await screen.findByText('No badges available')).toBeOnTheScreen();
  });
});
