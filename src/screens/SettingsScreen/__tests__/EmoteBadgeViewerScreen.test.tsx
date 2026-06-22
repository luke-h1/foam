import { fireEvent, screen } from '@testing-library/react-native';

import { EmoteBadgeViewerScreen } from '@app/screens/SettingsScreen/EmoteBadgeViewerScreen';
import { bttvEmoteService as _bttvEmoteService } from '@app/services/bttv-emote-service';
import { ffzService as _ffzService } from '@app/services/ffz-service';
import { sevenTvService as _sevenTvService } from '@app/services/seventv-service';
import { twitchBadgeService as _twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService as _twitchEmoteService } from '@app/services/twitch-emote-service';
import render from '@app/test/render';

import {
  bttvGlobalEmotesFixture,
  twitchGlobalBadgesFixture,
  twitchGlobalEmotesFixture,
} from './__fixtures__/globalEmoteBadgeData.fixture';

jest.mock('@app/services/bttv-emote-service');
jest.mock('@app/services/ffz-service');
jest.mock('@app/services/seventv-service');
jest.mock('@app/services/twitch-badge-service');
jest.mock('@app/services/twitch-emote-service');

// LegendList virtualizes natively and renders nothing under jest; render every
// item through renderItem so the grid content is assertable.
jest.mock('@legendapp/list/react-native', () => ({
  LegendList: ({
    data,
    renderItem,
    keyExtractor,
  }: {
    data: unknown[];
    renderItem: (info: { item: unknown; index: number }) => unknown;
    keyExtractor: (item: unknown, index: number) => string;
  }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(
      View,
      null,
      data.map((item, index) =>
        React.createElement(
          View,
          { key: keyExtractor(item, index) },
          renderItem({ item, index }),
        ),
      ),
    );
  },
}));

// The preview sheets pull in expo-media-library (via useSaveImageToGallery)
// and are exercised by their own tests; stub them here to keep this screen test
// focused on the viewer's data wiring.
jest.mock(
  '@app/components/Chat/components/EmotePreviewSheet/EmotePreviewSheet',
  () => ({ EmotePreviewSheet: () => null }),
);
jest.mock(
  '@app/components/Chat/components/BadgePreviewSheet/BadgePreviewSheet',
  () => ({ BadgePreviewSheet: () => null }),
);

// SegmentedControl wraps the native @expo/ui control, which cannot receive
// segment-change events in tests; expose each segment as a pressable instead.
jest.mock('@app/components/SegmentedControl/SegmentedControl', () => ({
  SegmentedControl: ({
    items,
    onChange,
  }: {
    items: { label: string }[];
    onChange: (index: number) => void;
  }) => {
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
  },
}));

const bttvEmoteService = jest.mocked(_bttvEmoteService);
const ffzService = jest.mocked(_ffzService);
const sevenTvService = jest.mocked(_sevenTvService);
const twitchBadgeService = jest.mocked(_twitchBadgeService);
const twitchEmoteService = jest.mocked(_twitchEmoteService);

describe('EmoteBadgeViewerScreen', () => {
  beforeEach(() => {
    twitchEmoteService.getGlobalEmotes.mockResolvedValue(
      twitchGlobalEmotesFixture,
    );
    bttvEmoteService.getSanitisedGlobalEmotes.mockResolvedValue(
      bttvGlobalEmotesFixture,
    );
    ffzService.getSanitisedGlobalEmotes.mockResolvedValue([]);
    sevenTvService.getSanitisedEmoteSet.mockResolvedValue([]);
    twitchBadgeService.listSanitisedGlobalBadges.mockResolvedValue(
      twitchGlobalBadgesFixture,
    );
    ffzService.getSanitisedGlobalBadges.mockResolvedValue([]);
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
    expect(twitchBadgeService.listSanitisedGlobalBadges).toHaveBeenCalled();
  });

  test('shows the empty state when no badges are available', async () => {
    twitchBadgeService.listSanitisedGlobalBadges.mockResolvedValue([]);

    render(<EmoteBadgeViewerScreen />);

    await screen.findByText('Global Emotes');

    fireEvent.press(screen.getByTestId('tab-badges'));

    expect(await screen.findByText('No badges available')).toBeOnTheScreen();
  });
});
